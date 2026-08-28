import { useState, useEffect, useCallback, useRef } from "react";

/* ── Types ──────────────────────────────────────────────────── */
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  colorId?: string;
  status: string;
}

interface TokenData {
  access_token: string;
  expires_at: number;
  refresh_token?: string;
}

const TOKEN_KEY = "thyme_google_tokens";
const SYNC_PREF_KEY = "thyme_google_sync";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

/* ── Helpers ────────────────────────────────────────────────── */
function loadTokens(): TokenData | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t: TokenData = JSON.parse(raw);
    if (t.expires_at < Date.now()) return null; // expired
    return t;
  } catch { return null; }
}

function saveTokens(t: TokenData) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

function loadSyncPref(): boolean {
  return localStorage.getItem(SYNC_PREF_KEY) === "true";
}

function saveSyncPref(v: boolean) {
  localStorage.setItem(SYNC_PREF_KEY, String(v));
}

/* Google color ID mapping (subset) */
const GOOGLE_COLORS: Record<string, string> = {
  "#e55b5b": "11", // red
  "#4caf50": "10", // green
  "#2196f3": "7",  // blue
  "#ff9800": "5",  // orange
  "#9c27b0": "3",  // purple
  "#00bcd4": "6",  // teal
  "#607d8b": "8",  // grey
  "#795548": "9",  // brown
  "#e91e63": "4",  // pink
  "#f44336": "11", // red
  "#ffeb3b": "5",  // yellow
};

function colorToGoogle(hex: string): string {
  return GOOGLE_COLORS[hex] || "1"; // default blue
}

function googleTimeToMinutes(googleEvent: GoogleCalendarEvent): number {
  const dt = googleEvent.start.dateTime || googleEvent.start.date || "";
  // Parse HH:MM from dateTime
  const match = dt.match(/T(\d{2}):(\d{2})/);
  if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
  // All-day event — default to 9am
  return 540;
}

function googleTimeToEnd(googleEvent: GoogleCalendarEvent): number {
  const dt = googleEvent.end.dateTime || googleEvent.end.date || "";
  const match = dt.match(/T(\d{2}):(\d{2})/);
  if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
  return 600;
}

function minutesToGoogleTime(mins: number, dateStr: string): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dateStr}T${pad(h)}:${pad(m)}:00`;
}

/* ── Hook ───────────────────────────────────────────────────── */
export function useGoogleCalendar(currentDate: Date) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(loadSyncPref);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<TokenData | null>(null);

  // Check connection on mount
  useEffect(() => {
    const tokens = loadTokens();
    if (tokens) {
      tokenRef.current = tokens;
      setIsConnected(true);
    }
  }, []);

  // Save sync preference
  useEffect(() => { saveSyncPref(syncEnabled); }, [syncEnabled]);

  /* ── Google Sign-In (using GIS popup) ── */
  const signIn = useCallback(() => {
    setError(null);
    // @ts-expect-error — Google Identity Services loaded from script tag
    const client = window.google?.accounts?.oauth2;
    if (!client) {
      setError("Google Sign-In not loaded. Please refresh the page.");
      return;
    }

    const tokenClient = client.initTokenClient({
      client_id: getGoogleClientId(),
      scope: SCOPE,
      callback: (tokenResponse: { access_token: string; expires_in: number; refresh_token?: string }) => {
        if (tokenResponse.access_token) {
          const tokens: TokenData = {
            access_token: tokenResponse.access_token,
            expires_at: Date.now() + tokenResponse.expires_in * 1000,
            refresh_token: tokenResponse.refresh_token,
          };
          saveTokens(tokens);
          tokenRef.current = tokens;
          setIsConnected(true);
        }
      },
      error_callback: (err: { type: string }) => {
        setError(`Google sign-in failed: ${err.type}`);
      },
    });

    tokenClient.requestAccessToken();
  }, []);

  /* ── Sign Out ── */
  const signOut = useCallback(() => {
    if (tokenRef.current?.access_token) {
      // @ts-expect-error
      window.google?.accounts?.oauth2?.revoke(tokenRef.current.access_token);
    }
    clearTokens();
    tokenRef.current = null;
    setIsConnected(false);
    setSyncEnabled(false);
    setLastSyncTime(null);
  }, []);

  /* ── Fetch Google Calendar events for the current week ── */
  const fetchGoogleEvents = useCallback(async (date: Date): Promise<GoogleCalendarEvent[]> => {
    const token = tokenRef.current;
    if (!token) throw new Error("Not connected to Google Calendar");

    // Week boundaries
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const timeMin = startOfWeek.toISOString();
    const timeMax = endOfWeek.toISOString();

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${token.access_token}` } }
    );

    if (!res.ok) {
      if (res.status === 401) {
        clearTokens();
        tokenRef.current = null;
        setIsConnected(false);
        throw new Error("Google session expired. Please sign in again.");
      }
      throw new Error(`Google Calendar API error: ${res.status}`);
    }

    const data = await res.json();
    return data.items || [];
  }, []);

  /* ── Push a local event to Google Calendar ── */
  const pushEvent = useCallback(async (localEvent: {
    title: string; start: string; end: string; category: string; note?: string; color?: string;
  }, date: Date): Promise<string | null> => {
    const token = tokenRef.current;
    if (!token) return null;

    const dateStr = date.toISOString().split("T")[0];
    const body = {
      summary: localEvent.title,
      description: `[Thyme] ${localEvent.category}${localEvent.note ? "\n" + localEvent.note : ""}`,
      start: { dateTime: minutesToGoogleTime(googleTimeToMinutes({ start: localEvent.start } as any), dateStr), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: minutesToGoogleTime(googleTimeToEnd({ end: localEvent.end } as any), dateStr), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      colorId: colorToGoogle(localEvent.color || "#4caf50"),
    };

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) return null;
    const created = await res.json();
    return created.id;
  }, []);

  /* ── Delete a Google Calendar event ── */
  const deleteGoogleEvent = useCallback(async (googleEventId: string) => {
    const token = tokenRef.current;
    if (!token) return;
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token.access_token}` } }
    );
  }, []);

  /* ── Full sync: pull Google events into local format ── */
  const pullEvents = useCallback(async (date: Date) => {
    setIsSyncing(true);
    setError(null);
    try {
      const googleEvents = await fetchGoogleEvents(date);
      const localEvents = googleEvents
        .filter(e => e.start.dateTime) // skip all-day events
        .map((e, i) => ({
          id: Date.now() + i, // temporary — will be reassigned
          title: e.summary || "Untitled",
          start: formatMins(googleTimeToMinutes(e)),
          end: formatMins(googleTimeToEnd(e)),
          category: "Google Calendar",
          note: e.description || "",
          repeat: [] as number[],
          color: undefined as string | undefined,
          googleEventId: e.id, // link to Google
        }));
      setLastSyncTime(new Date().toLocaleTimeString());
      setIsSyncing(false);
      return localEvents;
    } catch (err: any) {
      setError(err.message);
      setIsSyncing(false);
      return [];
    }
  }, [fetchGoogleEvents]);

  /* ── Push all local events to Google ── */
  const pushAllEvents = useCallback(async (events: Array<{
    title: string; start: string; end: string; category: string; note?: string; color?: string;
  }>, date: Date) => {
    setIsSyncing(true);
    setError(null);
    try {
      for (const ev of events) {
        await pushEvent(ev, date);
      }
      setLastSyncTime(new Date().toLocaleTimeString());
      setIsSyncing(false);
    } catch (err: any) {
      setError(err.message);
      setIsSyncing(false);
    }
  }, [pushEvent]);

  return {
    isConnected,
    isSyncing,
    syncEnabled,
    setSyncEnabled,
    lastSyncTime,
    error,
    signIn,
    signOut,
    pullEvents,
    pushAllEvents,
    pushEvent,
    deleteGoogleEvent,
  };
}

/* ── Utility functions ── */
function formatMins(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getGoogleClientId(): string {
  // Read from meta tag or environment
  const meta = document.querySelector('meta[name="google-signin-client_id"]');
  const fromMeta = meta?.getAttribute("content");
  if (fromMeta && fromMeta.length > 10) return fromMeta;
  // Fallback — will be set by user in settings
  return localStorage.getItem("thyme_google_client_id") || "";
}
