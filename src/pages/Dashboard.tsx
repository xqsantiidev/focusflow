import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit3, LogOut, Plus, X, Trash2, Dumbbell, BookOpen, Users, Sparkles, Repeat, Bookmark, Sun, Moon, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

/* ── Types ─────────────────────────────────────────────────── */
type Event = { id: number; title: string; start: string; end: string; category: string; note: string; repeat: number[]; color?: string };
type Template = { id: number; title: string; start: string; end: string; category: string; note: string; color?: string };
type Palette = Record<string, string>;

/* ── Palette (defaults) ───────────────────────────────────── */
const builtInPalette: Palette = { Class: "#4caf50", Study: "#ffc107", Health: "#e91e63", Life: "#9c27b0", Commute: "#2196f3", Free: "#b0bec5" };
const fallbackColor = "#b0bec5";
const getColor = (ev: Event, palette: Palette) => ev.color || palette[ev.category] || fallbackColor;
const iconMap: Record<string, React.FC<{ className?: string }>> = { Class: BookOpen, Study: Sparkles, Health: Dumbbell, Life: Users, Commute: ChevronRight, Free: Sparkles };
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Helpers ───────────────────────────────────────────────── */
function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fmtTime(t: string) { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`; }
function dur(e: Event) { return toMin(e.end) - toMin(e.start); }
function keyFor(d: Date) { return `thyme-${d.toISOString().slice(0, 10)}`; }
function dowKey(d: Date) { return `thyme-dow-${d.getDay()}`; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function round15(m: number) { return Math.round(m / 15) * 15; }
function minToStr(m: number) { const h = Math.floor(m / 60) % 24; const mm = m % 60; return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`; }

/* ── Persistence ───────────────────────────────────────────── */
function sanitizeEvents(events: Event[]): Event[] { return events.map(e => ({ ...e, repeat: e.repeat || [], color: e.color })); }
function loadEvents(date: Date): Event[] {
  try {
    const raw = localStorage.getItem(keyFor(date));
    if (raw) return sanitizeEvents(JSON.parse(raw));
  } catch { /* ignore */ }
  if (date.toDateString() === new Date(2024, 9, 16).toDateString()) return defaultDay;
  /* Seed from repeating blocks on other days */
  const repeating: Event[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + i);
    try { const r = localStorage.getItem(dowKey(d)); if (r) repeating.push(...sanitizeEvents(JSON.parse(r))); } catch { /* */ }
  }
  const dayRepeating = repeating.filter(e => (e.repeat || []).includes(date.getDay()));
  const seen = new Set<string>();
  return dayRepeating.filter(e => { const k = `${e.title}-${e.start}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
function saveEvents(date: Date, events: Event[]) { localStorage.setItem(keyFor(date), JSON.stringify(events)); }
function loadTemplates(): Template[] { try { return JSON.parse(localStorage.getItem("thyme-templates") || "[]"); } catch { return []; } }
function saveTemplates(t: Template[]) { localStorage.setItem("thyme-templates", JSON.stringify(t)); }
function loadPalette(): Palette { try { return { ...builtInPalette, ...JSON.parse(localStorage.getItem("thyme-palette") || "{}") }; } catch { return { ...builtInPalette }; } }
function savePalette(p: Palette) { localStorage.setItem("thyme-palette", JSON.stringify(p)); }

const defaultDay: Event[] = [
  { id: 1, title: "Pre-Calculus", start: "07:30", end: "08:30", category: "Class", note: "", repeat: [], color: undefined },
  { id: 2, title: "Exercise", start: "08:30", end: "09:15", category: "Health", note: "", repeat: [], color: undefined },
  { id: 3, title: "Government", start: "10:00", end: "11:00", category: "Class", note: "", repeat: [], color: undefined },
  { id: 4, title: "Chemistry", start: "11:30", end: "12:30", category: "Class", note: "", repeat: [], color: undefined },
  { id: 5, title: "Communication Arts", start: "12:45", end: "13:45", category: "Class", note: "", repeat: [], color: undefined },
  { id: 6, title: "Transportation", start: "14:00", end: "14:30", category: "Commute", note: "", repeat: [], color: undefined },
  { id: 7, title: "Pre-Calculus Assignment", start: "15:00", end: "16:00", category: "Study", note: "", repeat: [], color: undefined },
  { id: 8, title: "Make Project Video", start: "16:15", end: "17:15", category: "Life", note: "", repeat: [], color: undefined },
  { id: 9, title: "Take-Home Quiz", start: "17:30", end: "18:30", category: "Study", note: "", repeat: [], color: undefined },
  { id: 10, title: "Free time", start: "19:00", end: "20:30", category: "Free", note: "", repeat: [], color: undefined },
  { id: 11, title: "Daredevil", start: "20:30", end: "21:15", category: "Free", note: "", repeat: [], color: undefined },
];

/* ── Circle component ──────────────────────────────────────── */
function SketchCircle({
  events, selected, onSelect, onEmpty, palette, heatMap, onDragEnd,
}: {
  events: Event[]; selected: number | null; onSelect: (id: number) => void;
  onEmpty: (time: string) => void; palette: Palette;
  heatMap: boolean; onDragEnd: (id: number, newStart: string, newEnd: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const S = 620, C = S / 2, innerR = 120, outerR = 238;
  const timeToAngle = (mins: number) => (mins / 1440) * Math.PI * 2 - Math.PI / 2;
  const pt = (r: number, a: number) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  const [dragging, setDragging] = useState<{ eventId: number; edge: "start" | "end" } | null>(null);
  const [dragTick, setDragTick] = useState(0);
  const justDraggedRef = useRef(false);
  const pathRefs = useRef<Map<number, SVGPathElement>>(new Map());
  const animAngles = useRef<Map<number, { start: number; end: number }>>(new Map());
  const animFrameRef = useRef<number>(0);
  /* Stable ref callback per event id — avoids creating new function refs */
  const pathRefCallbacks = useRef<Record<number, (el: SVGPathElement | null) => void>>({});
  const getPathRef = (id: number) => {
    if (!pathRefCallbacks.current[id]) {
      pathRefCallbacks.current[id] = (el) => { if (el) pathRefs.current.set(id, el); };
    }
    return pathRefCallbacks.current[id];
  };

  const getEventAt = (x: number, y: number) => {
    const r = Math.hypot(x, y);
    if (r < innerR || r > outerR + 40) return null;
    let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
    const mins = round15(a / (Math.PI * 2) * 1440);
    return events.find(e => mins >= toMin(e.start) && mins < toMin(e.end));
  };

  const svgXY = (e: React.MouseEvent | React.PointerEvent) => {
    if (!svgRef.current) return [0, 0];
    const rect = svgRef.current.getBoundingClientRect();
    return [(e.clientX - rect.left) * S / rect.width - C, (e.clientY - rect.top) * S / rect.height - C];
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragging || justDraggedRef.current) { justDraggedRef.current = false; return; }
    const [x, y] = svgXY(e);
    const found = getEventAt(x, y);
    if (found) { onSelect(found.id); return; }
    const r = Math.hypot(x, y);
    if (r < innerR - 10 || r > outerR + 40) return;
    let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
    const mins = round15(a / (Math.PI * 2) * 1440);
    onEmpty(minToStr(mins));
  };

  /* Build SVG path string from start/end minutes */
  const buildPath = (sMin: number, eMin: number) => {
    const sa = timeToAngle(sMin); const ea = timeToAngle(eMin);
    const [ix1, iy1] = pt(innerR, sa); const [ox1, oy1] = pt(outerR, sa);
    const [ix2, iy2] = pt(innerR, ea); const [ox2, oy2] = pt(outerR, ea);
    const large = ea - sa > Math.PI ? 1 : 0;
    return `M ${ix1} ${iy1} L ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;
  };
  /* Spring-bounce interpolation for smooth visual resize */
  const springLerp = (current: number, target: number, speed = 0.18) => current + (target - current) * speed;

  const handlePointerDown = (e: React.PointerEvent, eventId: number, edge: "start" | "end") => {
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    const ev = events.find(ev2 => ev2.id === eventId);
    if (ev) animAngles.current.set(eventId, { start: toMin(ev.start), end: toMin(ev.end) });
    setDragging({ eventId, edge });
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !svgRef.current) return;
    const [x, y] = svgXY(e);
    const r = Math.hypot(x, y);
    if (r < innerR || r > outerR + 60) return;
    let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
    const mins = round15(a / (Math.PI * 2) * 1440);
    const ev = events.find(ev2 => ev2.id === dragging.eventId);
    if (!ev) return;
    const cur = animAngles.current.get(ev.id);
    if (!cur) return;
    const startMin = cur.start; const endMin = cur.end;
    let newStart = startMin, newEnd = endMin;
    if (dragging.edge === "start") {
      if (mins < endMin && endMin - mins >= 15) newStart = mins;
    } else {
      if (mins > startMin && mins - startMin >= 15) newEnd = mins;
    }
    if (newStart !== startMin || newEnd !== endMin) {
      animAngles.current.set(ev.id, { start: newStart, end: newEnd });
      setDragTick(t => t + 1);
    }
  };
  const handlePointerUp = () => {
    if (dragging) {
      justDraggedRef.current = true;
      const ev = events.find(ev2 => ev2.id === dragging.eventId);
      const cur = ev ? animAngles.current.get(ev.id) : null;
      if (ev && cur) {
        const snapS = round15(cur.start); const snapE = round15(cur.end);
        /* Animate bounce-back to snapped position */
        const targetStart = snapS, targetEnd = snapE;
        const path = pathRefs.current.get(ev.id);
        let frameS = cur.start, frameE = cur.end;
        const animate = () => {
          frameS = springLerp(frameS, targetStart, 0.2);
          frameE = springLerp(frameE, targetEnd, 0.2);
          if (path) path.setAttribute("d", buildPath(frameS, frameE));
          if (Math.abs(frameS - targetStart) > 0.3 || Math.abs(frameE - targetEnd) > 0.3) {
            animFrameRef.current = requestAnimationFrame(animate);
          } else {
            if (path) path.setAttribute("d", buildPath(targetStart, targetEnd));
            animAngles.current.set(ev.id, { start: targetStart, end: targetEnd });
            onDragEnd(ev.id, minToStr(targetStart), minToStr(targetEnd));
          }
        };
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }
    setDragging(null);
  };
  useEffect(() => { if (justDraggedRef.current) { const t = setTimeout(() => { justDraggedRef.current = false; }, 80); return () => clearTimeout(t); } });

  /* Heat map data: density per 15-min slot */
  const heatData = Array.from({ length: 96 }, (_, i) => {
    const t = i * 15;
    return events.filter(e => t >= toMin(e.start) && t < toMin(e.end)).length;
  });
  const maxHeat = Math.max(...heatData, 1);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[620px]">
      <svg ref={svgRef} viewBox={`0 0 ${S} ${S}`}
        onClick={handleClick} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
        className="w-full touch-manipulation">
        <defs>
          <pattern id="pat-stripe" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#2196f3" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#1a1a18" strokeWidth="2.5" />
          </pattern>
          <pattern id="pat-dots" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#b0bec5" />
            <circle cx="5" cy="5" r="2" fill="#1a1a18" />
          </pattern>
          <filter id="sketch"><feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="3" result="warp" /><feDisplacementMap in="SourceGraphic" in2="warp" scale="1.5" /></filter>
        </defs>

        {/* Outer dotted guide */}
        <circle cx={C} cy={C} r={outerR + 12} fill="none" stroke="var(--sketch-line)" strokeWidth="2" strokeDasharray="4 6" opacity="0.5" />

        {/* Hour ticks */}
        {Array.from({ length: 24 }, (_, h) => {
          const a = timeToAngle(h * 60); const main = h % 3 === 0; const len = main ? 18 : 10;
          const [x1, y1] = pt(outerR + 18, a); const [x2, y2] = pt(outerR + 18 + len, a);
          return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--sketch-line)" strokeWidth={main ? 2.2 : 1.2} strokeLinecap="round" opacity={main ? 0.8 : 0.4} />;
        })}

        {/* Hour labels */}
        {[6, 9, 12, 15, 18, 21].map(h => {
          const a = timeToAngle(h * 60); const [lx, ly] = pt(outerR + 44, a);
          const h12 = h % 12 || 12; const ap = h >= 12 ? "pm" : "am";
          return <text key={h} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="sketch-label" fontSize="12" fill="var(--sketch-fg)" opacity="0.5" fontWeight="500">{h12}{ap}</text>;
        })}

        {/* Wedge segments */}
        {events.map((ev, i) => {
          const a = animAngles.current.get(ev.id);
          const sMin = a ? a.start : toMin(ev.start);
          const eMin = a ? a.end : toMin(ev.end);
          const d = buildPath(sMin, eMin);
          const color = getColor(ev, palette);
          const fill = ev.category === "Commute" ? "url(#pat-stripe)" : ev.category === "Free" ? "url(#pat-dots)" : color;
          const s = timeToAngle(sMin); const e2 = timeToAngle(eMin);
          const [ox1, oy1] = pt(outerR, s); const [ox2, oy2] = pt(outerR, e2);
          const midA = (s + e2) / 2;
          /* Spread labels outward based on proximity to other labels */
          const gap = Math.abs(toMin(ev.end) - toMin(ev.start));
          const nearbyCount = events.filter(o => o.id !== ev.id && Math.abs(toMin(o.start) - toMin(ev.start)) < 90).length;
          const spread = (gap < 30 ? 1.2 : gap < 60 ? 1.1 : 1.0) + nearbyCount * 0.06;
          const midR = (outerR + 56) * spread;
          const [lx, ly] = pt(midR, midA);
          const [ax, ay] = pt(outerR + 14, midA);
          const isSel = selected === ev.id;
          const isDraggingThis = dragging?.eventId === ev.id;

          return (
            <g key={ev.id}>
              <motion.path ref={getPathRef(ev.id) as (el: any) => void}
                d={d} fill={fill} stroke="var(--sketch-bg)" strokeWidth="2.5" strokeLinejoin="round"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: isDraggingThis ? 0.92 : 1 }}
                transition={isDraggingThis
                  ? { type: "spring", stiffness: 120, damping: 14 }
                  : { delay: i * 0.04, type: "spring", stiffness: 260, damping: 18 }}
                whileHover={{ scale: isSel ? 1 : 1.01 }}
                className="cursor-pointer" onClick={e => { e.stopPropagation(); onSelect(ev.id); }}
                style={{ transformOrigin: `${C}px ${C}px` }} />
              {/* Resize handles */}
              {isSel && <>
                {/* Animated pulse ring on active drag handle */}
                {isDraggingThis && <circle cx={dragging?.edge === "start" ? ox1 : ox2} cy={dragging?.edge === "start" ? oy1 : oy2} r="14" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
                  <animate attributeName="r" values="11;16;11" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.15;0.4" dur="1s" repeatCount="indefinite" />
                </circle>}
                <circle cx={ox1} cy={oy1} r="8" fill="var(--sketch-bg)" stroke={color} strokeWidth="2.5"
                  className="cursor-grab active:cursor-grabbing" onPointerDown={e => handlePointerDown(e, ev.id, "start")} />
                <circle cx={ox2} cy={oy2} r="8" fill="var(--sketch-bg)" stroke={color} strokeWidth="2.5"
                  className="cursor-grab active:cursor-grabbing" onPointerDown={e => handlePointerDown(e, ev.id, "end")} />
              </>}
              {/* Label */}
              <line x1={ax} y1={ay} x2={lx} y2={ly} stroke="var(--sketch-fg)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.35" />
              {/* Title — Caveat renders all characters (digits, letters, punctuation) */}
              <text x={lx} y={ly - 8} textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="13" fill="var(--sketch-fg)" fontWeight="700" style={{ letterSpacing: '0.01em' }}>{ev.title}</text>
              {/* Time — Caveat for consistent look, plain hyphen for clean rendering */}
              <text x={lx} y={ly + 7} textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="11" fill="var(--sketch-fg)" fontWeight="500" opacity="0.8">{fmtTime(ev.start)} - {fmtTime(ev.end)}</text>
              <circle cx={ax} cy={ay} r="4" fill="var(--sketch-bg)" stroke="var(--sketch-fg)" strokeWidth="2" opacity="0.6" />
            </g>
          );
        })}

        {/* Inner circle */}
        <circle cx={C} cy={C} r={innerR} fill="var(--sketch-bg)" stroke="var(--sketch-line)" strokeWidth="2.5" filter="url(#sketch)" />

        {/* Heat map ring (rendered on top) */}
        {heatMap && heatData.map((count, i) => {
          if (count === 0) return null;
          const mid = ((i + 0.5) / 96) * Math.PI * 2 - Math.PI / 2;
          const r = innerR + 18;
          const [cx, cy] = pt(r, mid);
          const opacity = 0.2 + (count / maxHeat) * 0.6;
          const size = 3 + (count / maxHeat) * 5;
          return <circle key={`heat-${i}`} cx={cx} cy={cy} r={size} fill="#e55b5b" opacity={opacity} />;
        })}

        {/* Now indicator — pulsing red dot on the inner ring at current time */}
        {(() => {
          const now = new Date();
          const nowMins = now.getHours() * 60 + now.getMinutes();
          const a = timeToAngle(nowMins);
          const nowR = innerR + 14;
          const [nx, ny] = pt(nowR, a);
          return (
            <g>
              {/* Glow ring behind the dot */}
              <circle cx={nx} cy={ny} r="12" fill="none" stroke="#e55b5b" strokeWidth="1.5" opacity="0.3">
                <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Main dot — larger, more visible */}
              <circle cx={nx} cy={ny} r="6" fill="#e55b5b">
                <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Inner highlight */}
              <circle cx={nx} cy={ny} r="2.5" fill="#fff" opacity="0.7" />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const { signOut } = useAuth(); const navigate = useNavigate();
  const [date, setDate] = useState(new Date(2024, 9, 16));
  const [events, setEvents] = useState<Event[]>(() => loadEvents(new Date(2024, 9, 16)));
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<Event | null>(null);
  const [palette, setPalette] = useState<Palette>(loadPalette);
  const [templates, setTemplates] = useState<Template[]>(loadTemplates);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [heatMap, setHeatMap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => { setEvents(loadEvents(date)); setSelected(null); }, [date]);
  useEffect(() => { saveEvents(date, events); }, [events, date]);
  useEffect(() => { savePalette(palette); }, [palette]);
  useEffect(() => { saveTemplates(templates); }, [templates]);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const active = events.find(e => e.id === selected) || null;
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const moveDay = (n: number) => setDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));

  const save = (ev: Event) => {
    setEvents(list => {
      const next = list.some(x => x.id === ev.id) ? list.map(x => x.id === ev.id ? ev : x) : [...list, ev];
      return next.sort((a, b) => toMin(a.start) - toMin(b.start));
    });
    /* If repeating, also save to dow storage */
    if ((ev.repeat || []).length > 0) {
      ev.repeat.forEach(dow => {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + dow);
        const key = dowKey(d);
        try {
          const existing: Event[] = JSON.parse(localStorage.getItem(key) || "[]");
          const without = existing.filter(e => e.id !== ev.id);
          without.push(ev);
          localStorage.setItem(key, JSON.stringify(without));
        } catch { localStorage.setItem(key, JSON.stringify([ev])); }
      });
    }
    setSelected(ev.id); setEditing(null);
  };
  const remove = (id: number) => {
    setEvents(list => list.filter(e => e.id !== id));
    /* Clean up repeating storage */
    for (let i = 0; i < 7; i++) {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + i);
      const key = dowKey(d);
      try { const existing: Event[] = JSON.parse(localStorage.getItem(key) || "[]"); localStorage.setItem(key, JSON.stringify(existing.filter(e => e.id !== id))); } catch { /* */ }
    }
    setSelected(null);
  };
  const handleDragEnd = (id: number, newStart: string, newEnd: string) => {
    setEvents(list => list.map(e => e.id === id ? { ...e, start: newStart, end: newEnd } : e).sort((a, b) => toMin(a.start) - toMin(b.start)));
  };
  const addTemplate = (ev: Event) => {
    const t: Template = { id: Date.now(), title: ev.title, start: ev.start, end: ev.end, category: ev.category, note: ev.note, color: ev.color };
    setTemplates(list => [...list, t]);
  };
  const applyTemplate = (t: Template) => {
    setEditing({ id: 0, title: t.title, start: t.start, end: t.end, category: t.category, note: t.note, repeat: [], color: t.color });
    setShowTemplates(false);
  };
  const updateColor = (cat: string, color: string) => setPalette(p => ({ ...p, [cat]: color }));
  const addCategory = (name: string) => { if (name.trim() && !palette[name.trim()]) { setPalette(p => ({ ...p, [name.trim()]: fallbackColor })); } };
  const removeCategory = (cat: string) => { if (builtInPalette[cat]) return; setPalette(p => { const { [cat]: _, ...rest } = p; return rest; }); };
  const [newCatName, setNewCatName] = useState("");

  return (
    <main className="sketchbook">
      <div className="mx-auto flex min-h-screen max-w-[620px] flex-col px-5 pb-10 pt-6 sm:px-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center justify-between">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setDate(new Date(2024, 9, 16))} className="sketch-link flex items-center gap-2 text-xl font-bold">
            thyme<span className="text-[#e55b5b]">.</span>
          </motion.button>
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.08, rotate: 5 }} whileTap={{ scale: 0.9 }}
              onClick={() => setShowStats(true)} className={`sketch-btn-icon size-8 ${heatMap ? "bg-[#e55b5b]/10 border-[#e55b5b]" : ""}`} title="Stats & heat map">
              <svg viewBox="0 0 16 16" className="size-3.5"><rect x="1" y="10" width="3" height="5" rx="0.5" fill="currentColor" opacity=".3" /><rect x="5" y="7" width="3" height="8" rx="0.5" fill="currentColor" opacity=".6" /><rect x="9" y="4" width="3" height="11" rx="0.5" fill="currentColor" opacity=".8" /><rect x="13" y="1" width="3" height="14" rx="0.5" fill="currentColor" /></svg>
            </motion.button>
            <motion.button whileHover={{ scale: 1.08, rotate: 180 }} whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              onClick={() => setDark(!dark)} className="sketch-btn-icon size-8" title="Toggle dark mode">
              {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.08, rotate: 30 }} whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              onClick={() => setShowSettings(s => !s)} className="sketch-btn-icon size-8" title="Settings">⚙</motion.button>
            <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
              onClick={async () => { await signOut(); navigate("/"); }} className="sketch-link flex items-center gap-1.5 text-xs">
              <LogOut className="size-3.5" /> sign out
            </motion.button>
          </div>
        </motion.header>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4">
              <div className="sketch-card">
                <p className="sketch-label text-xs mb-3">customize categories & colors</p>
                <div className="space-y-2 mb-4">
                  {Object.keys(palette).map(cat => (
                    <div key={cat} className="flex items-center gap-2 text-xs">
                      <input type="color" value={palette[cat]} onChange={e => updateColor(cat, e.target.value)} className="size-6 cursor-pointer rounded border-0 bg-transparent" />
                      <span className="sketch-label flex-1">{cat}</span>
                      <button onClick={() => removeCategory(cat)} className="text-[var(--sketch-muted)] opacity-40 hover:opacity-100 hover:text-[#e55b5b]"><Trash2 className="size-3" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="new category name" className="sketch-input flex-1" onKeyDown={e => { if (e.key === "Enter" && newCatName.trim()) { addCategory(newCatName.trim()); setNewCatName(""); } }} />
                  <button onClick={() => { if (newCatName.trim()) { addCategory(newCatName.trim()); setNewCatName(""); } }} className="sketch-btn-icon size-9"><Plus className="size-3.5" /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day navigation */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-8 flex items-center justify-between">
          <motion.button whileHover={{ scale: 1.1, x: -3 }} whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => moveDay(-1)} className="sketch-btn-icon"><ChevronLeft className="size-5" /></motion.button>
          <motion.div key={`${date.toDateString()}-date`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }} className="text-center">
            <p className="sketch-label text-lg">{weekday}</p>
            <h1 className="sketch-title text-5xl mt-1">{date.getDate()} <span className="text-[var(--sketch-muted)]">{month}</span></h1>
            <p className="sketch-label text-xs mt-1 opacity-50">{date.getFullYear()}</p>
          </motion.div>
          <motion.button whileHover={{ scale: 1.1, x: 3 }} whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => moveDay(1)} className="sketch-btn-icon"><ChevronRight className="size-5" /></motion.button>
        </motion.div>

        {/* Week dots */}
        <div className="mt-5 flex justify-center gap-3">
          {[-3, -2, -1, 0, 1, 2, 3].map((offset, i) => {
            const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
            const isToday = offset === 0;
            const initial = d.toLocaleDateString("en-US", { weekday: "narrow" });
            return (
              <motion.button key={offset} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                onClick={() => setDate(d)}
                className={`sketch-pill ${isToday ? "sketch-pill-active" : ""}`}>
                <span className="text-[10px] uppercase">{initial}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Circle */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          className="mt-8">
          <SketchCircle events={events} selected={selected} onSelect={setSelected} palette={palette} heatMap={heatMap}
            onEmpty={time => setEditing({ id: 0, title: "", start: time, end: minToStr(clamp(toMin(time) + 45, 0, 1439)), category: "Study", note: "", repeat: [], color: undefined })}
            onDragEnd={handleDragEnd} />
        </motion.div>

        {/* Legend */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.4 }}
          className="mt-1 text-center text-[10px] uppercase tracking-[.18em] text-[var(--sketch-muted)]">
          tap to select · drag edges to resize · tap empty to add
        </motion.p>

        {/* Category legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.45 }}
          className="mt-4 flex items-center justify-center gap-5 text-[9px] uppercase tracking-[.15em] text-[var(--sketch-muted)]">
          {Object.keys(palette).map(c => (
            <span key={c} className="flex items-center gap-1.5"><i className="size-2 rounded-sm" style={{ backgroundColor: palette[c] }} />{c}</span>
          ))}
        </motion.div>

        {/* Selected detail */}
        <AnimatePresence>
          {active && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="sketch-card mt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="sketch-dot" style={{ backgroundColor: getColor(active, palette) }} />
                    <span className="sketch-label text-xs uppercase">{active.category}</span>
                    {(active.repeat || []).length > 0 && <Repeat className="size-3 opacity-40" />}
                  </div>
                  <h3 className="sketch-title text-2xl">{active.title}</h3>
                  <p className="sketch-label text-sm mt-1">{fmtTime(active.start)} — {fmtTime(active.end)} · {dur(active)} min</p>
                  {(active.repeat || []).length > 0 && (
                    <p className="sketch-label text-[10px] mt-1 opacity-50">repeats {(active.repeat || []).map(d => dayNames[d]).join(", ")}</p>
                  )}
                </div>
              </div>
              {active.note && <p className="sketch-body text-sm mt-3 opacity-60">{active.note}</p>}
              <div className="flex gap-2 mt-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setEditing(active)} className="sketch-btn"><Edit3 className="size-3.5" /> edit</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => addTemplate(active)} className="sketch-btn"><Bookmark className="size-3.5" /> save as template</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => remove(active.id)} className="sketch-btn sketch-btn-danger"><Trash2 className="size-3.5" /> remove</motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FABs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 18 }}
          className="flex justify-center gap-3 mt-6">
          <motion.button whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowTemplates(true)} className="sketch-btn"><Bookmark className="size-3.5" /> templates</motion.button>
          <motion.button whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9, rotate: 45 }}
            transition={{ type: "spring", stiffness: 300, damping: 12 }}
            onClick={() => setEditing({ id: 0, title: "", start: "12:00", end: "12:45", category: "Study", note: "", repeat: [], color: undefined })} className="sketch-fab">
            <Plus className="size-5" />
          </motion.button>
        </motion.div>

        {/* Template picker */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-5 backdrop-blur-[2px]">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="composer w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="sketch-title text-xl">templates</h2>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setShowTemplates(false)} className="sketch-btn-icon size-8"><X className="size-4" /></motion.button>
                </div>
                {templates.length === 0 ? (
                  <p className="sketch-body text-sm opacity-50 py-6 text-center">no templates yet — create a block and save it as a template.</p>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {templates.map((t, i) => (
                      <motion.button key={t.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}
                        onClick={() => applyTemplate(t)}
                        className="w-full flex items-center gap-3 rounded-xl border border-[var(--sketch-border)] p-3 text-left hover:bg-[var(--sketch-hover)] transition">
                        <span className="sketch-dot" style={{ backgroundColor: t.color || palette[t.category] }} />
                        <div className="flex-1 min-w-0">
                          <p className="sketch-title text-sm truncate">{t.title}</p>
                          <p className="sketch-label text-[10px]">{fmtTime(t.start)} — {fmtTime(t.end)} · {t.category}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setTemplates(list => list.filter(x => x.id !== t.id)); }}
                          className="text-[var(--sketch-muted)] opacity-40 hover:opacity-100"><Trash2 className="size-3" /></button>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Stats overlay */}
      <AnimatePresence>
        {showStats && <StatsView onClose={() => setShowStats(false)} palette={palette} currentDate={date} />}
      </AnimatePresence>

      {/* Composer */}
      <AnimatePresence>
        {editing && <Composer event={editing} onClose={() => setEditing(null)} onSave={save} palette={palette} />}
      </AnimatePresence>
    </main>
  );
}

/* ── Stats / Heatmap View ──────────────────────────────────── */
function StatsView({ onClose, palette, currentDate }: { onClose: () => void; palette: Palette; currentDate: Date }) {
  /* Load events for the full week */
  const weekEvents: Event[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + i);
    weekEvents.push(...loadEvents(d));
  }

  /* Busiest days (Mon-Sun) */
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + i);
    return { day: dayNames[i], events: loadEvents(d).length, date: d.getDate(), month: d.toLocaleDateString("en-US", { month: "short" }) };
  });
  const maxDaily = Math.max(...daily.map(d => d.events), 1);

  /* Hourly activity (0-23) */
  const hourly = Array.from({ length: 24 }, (_, h) => {
    return weekEvents.filter(e => {
      const s = toMin(e.start); const en = toMin(e.end);
      return h * 60 >= s && h * 60 < en;
    }).length;
  });
  const maxHourly = Math.max(...hourly, 1);

  /* Category breakdown */
  const catCounts: Record<string, number> = {};
  weekEvents.forEach(e => { catCounts[e.category] = (catCounts[e.category] || 0) + dur(e); });
  const totalMin = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;
  const catList = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

  /* Total stats */
  const totalBlocks = weekEvents.length;
  const totalHours = Math.floor(totalMin / 60);
  const avgPerDay = (totalBlocks / 7).toFixed(1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-5 backdrop-blur-[2px]">
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-[var(--sketch-border)] bg-[var(--sketch-card)] p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="sketch-title text-2xl">weekly stats</h2>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} className="sketch-btn-icon size-8"><X className="size-4" /></motion.button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "total blocks", value: totalBlocks },
            { label: "total hours", value: totalHours },
            { label: "avg / day", value: avgPerDay },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-xl border border-[var(--sketch-border)] p-3 text-center">
              <p className="sketch-title text-2xl">{s.value}</p>
              <p className="sketch-label text-[9px] mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Daily bar chart */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-6">
          <p className="sketch-label text-xs mb-3">busiest days</p>
          <div className="flex items-end gap-2 h-28">
            {daily.map((d, i) => {
              const h = maxDaily > 0 ? (d.events / maxDaily) * 100 : 0;
              const isToday = d.date === currentDate.getDate();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 200, damping: 18 }}
                    className={`w-full rounded-t-md min-h-[2px] ${isToday ? "bg-[#e55b5b]" : "bg-[var(--sketch-fg)] opacity-25"}`} />
                  <span className="sketch-label text-[8px]">{d.day}</span>
                  <span className="sketch-label text-[8px] opacity-50">{d.date}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Hourly heatmap */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mb-6">
          <p className="sketch-label text-xs mb-3">hourly activity</p>
          <div className="grid grid-cols-12 gap-1">
            {hourly.map((count, h) => {
              const intensity = maxHourly > 0 ? count / maxHourly : 0;
              const bg = intensity === 0 ? "var(--sketch-border)" : `rgba(229, 91, 91, ${0.15 + intensity * 0.85})`;
              return (
                <motion.div key={h} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.35 + h * 0.02, type: "spring", stiffness: 300, damping: 15 }}
                  className="aspect-square rounded-md relative group cursor-default"
                  style={{ backgroundColor: bg }}>
                  <span className="sketch-label text-[7px] absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
                  </span>
                </motion.div>
              );
            })}
          </div>
          <div className="flex justify-between mt-5">
            <span className="sketch-label text-[8px]">12am</span>
            <span className="sketch-label text-[8px]">6am</span>
            <span className="sketch-label text-[8px]">12pm</span>
            <span className="sketch-label text-[8px]">6pm</span>
            <span className="sketch-label text-[8px]">12am</span>
          </div>
        </motion.div>

        {/* Category breakdown */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <p className="sketch-label text-xs mb-3">time by category</p>
          <div className="space-y-2">
            {catList.map(([cat, mins], i) => {
              const pct = (mins / totalMin) * 100;
              const color = palette[cat] || fallbackColor;
              return (
                <motion.div key={cat} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }} className="flex items-center gap-3">
                  <span className="sketch-dot" style={{ backgroundColor: color }} />
                  <span className="sketch-label text-[10px] w-20 flex-shrink-0">{cat}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--sketch-border)] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 100, damping: 18 }}
                      className="h-full rounded-full" style={{ backgroundColor: color }} />
                  </div>
                  <span className="sketch-label text-[9px] w-12 text-right">{Math.floor(mins / 60)}h {mins % 60}m</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}

/* ── Composer ──────────────────────────────────────────────── */
function Composer({ event, onClose, onSave, palette }: { event: Event; onClose: () => void; onSave: (ev: Event) => void; palette: Palette }) {
  const [title, setTitle] = useState(event.title);
  const [start, setStart] = useState(event.start);
  const [end, setEnd] = useState(event.end);
  const [category, setCategory] = useState(event.category);
  const [note, setNote] = useState(event.note);
  const [repeat, setRepeat] = useState<number[]>(event.repeat || []);
  const [color, setColor] = useState(event.color || palette[event.category]);
  const [useCustomColor, setUseCustomColor] = useState(!!event.color);

  const toggleRepeat = (d: number) => setRepeat(list => list.includes(d) ? list.filter(x => x !== d) : [...list, d]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || toMin(end) <= toMin(start)) return;
    onSave({ ...event, title: title.trim(), start, end, category, note, repeat, color: useCustomColor ? color : undefined });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-5 backdrop-blur-[2px]">
      <motion.form initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onSubmit={submit} className="composer">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-5">
          <h2 className="sketch-title text-2xl">{event.id ? "edit block" : "new block"}</h2>
          <motion.button type="button" whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} className="sketch-btn-icon size-8"><X className="size-4" /></motion.button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <label className="sketch-label text-xs">title</label>
          <Input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Chemistry lecture" className="sketch-input mt-1.5" required />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="grid grid-cols-2 gap-3 mt-4">
          <div><label className="sketch-label text-xs">start</label><Input type="time" value={start} onChange={e => setStart(e.target.value)} className="sketch-input mt-1.5" /></div>
          <div><label className="sketch-label text-xs">end</label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} className="sketch-input mt-1.5" /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <label className="sketch-label text-xs mt-4 block">category</label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {Object.keys(palette).map((cat, i) => (
              <motion.button type="button" key={cat} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.22 + i * 0.03, type: "spring", stiffness: 300, damping: 18 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setCategory(cat); if (!useCustomColor) setColor(palette[cat]); }}
                className={`sketch-chip ${category === cat ? "sketch-chip-active" : ""}`}>
                <span className="sketch-dot" style={{ backgroundColor: palette[cat] }} />{cat}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Custom color */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <label className="sketch-label text-xs mt-4 block">color</label>
          <div className="flex items-center gap-3 mt-1.5">
            <motion.input whileHover={{ scale: 1.15 }} type="color" value={color} onChange={e => { setColor(e.target.value); setUseCustomColor(true); }}
              className="size-7 cursor-pointer rounded border-0 bg-transparent" />
            <button type="button" onClick={() => { setUseCustomColor(false); setColor(palette[category]); }}
              className="sketch-label text-[10px] opacity-50 hover:opacity-100">reset to category default</button>
          </div>
        </motion.div>

        {/* Repeat */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <label className="sketch-label text-xs mt-4 block flex items-center gap-1.5">
            <Repeat className="size-3" /> repeat on
          </label>
          <div className="flex gap-1.5 mt-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((d, i) => (
              <motion.button type="button" key={d} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.34 + i * 0.03, type: "spring", stiffness: 400, damping: 15 }}
                whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                onClick={() => toggleRepeat(d)}
                className={`size-8 rounded-lg border text-[10px] font-medium transition ${repeat.includes(d) ? "bg-[var(--sketch-fg)] text-[var(--sketch-bg)] border-[var(--sketch-fg)]" : "border-[var(--sketch-border)] text-[var(--sketch-muted)] hover:border-[var(--sketch-fg)]"}`}>
                {dayNames[d]}
            </motion.button>
          ))}
        </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
          <label className="sketch-label text-xs mt-4 block">note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="optional" className="sketch-input sketch-textarea mt-1.5" />
        </motion.div>

        <motion.button type="submit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
          className="sketch-btn-primary mt-5 w-full">{event.id ? "save changes" : "add to my day"}</motion.button>
      </motion.form>
    </motion.div>
  );
}
