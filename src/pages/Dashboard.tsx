import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit3, LogOut, Plus, X, Trash2, Dumbbell, BookOpen, Users, Sparkles, Repeat, Bookmark, Sun, Moon, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

/* ── Types ─────────────────────────────────────────────────── */
type Category = "Class" | "Study" | "Health" | "Life" | "Commute" | "Free";
type Event = { id: number; title: string; start: string; end: string; category: Category; note: string; repeat: number[]; color?: string };
type Template = { id: number; title: string; start: string; end: string; category: Category; note: string; color?: string };

/* ── Palette (defaults) ───────────────────────────────────── */
const defaultPalette: Record<Category, string> = { Class: "#4caf50", Study: "#ffc107", Health: "#e91e63", Life: "#9c27b0", Commute: "#2196f3", Free: "#b0bec5" };
const fallbackColor = "#b0bec5";
const getColor = (ev: Event, palette: Record<Category, string>) => ev.color || palette[ev.category] || fallbackColor;
const getCatColor = (cat: Category, palette: Record<Category, string>) => palette[cat] || fallbackColor;

const categoryIcons: Record<Category, React.FC<{ className?: string }>> = { Class: BookOpen, Study: Sparkles, Health: Dumbbell, Life: Users, Commute: ChevronRight, Free: Sparkles };
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
function loadPalette(): Record<Category, string> { try { return JSON.parse(localStorage.getItem("thyme-palette") || "null") || defaultPalette; } catch { return defaultPalette; } }
function savePalette(p: Record<Category, string>) { localStorage.setItem("thyme-palette", JSON.stringify(p)); }

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
  onEmpty: (time: string) => void; palette: Record<Category, string>;
  heatMap: boolean; onDragEnd: (id: number, newStart: string, newEnd: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const S = 620, C = S / 2, innerR = 120, outerR = 238;
  const timeToAngle = (mins: number) => (mins / 1440) * Math.PI * 2 - Math.PI / 2;
  const pt = (r: number, a: number) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  const [dragging, setDragging] = useState<{ eventId: number; edge: "start" | "end" } | null>(null);

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
    if (dragging) return;
    const [x, y] = svgXY(e);
    const found = getEventAt(x, y);
    if (found) { onSelect(found.id); return; }
    const r = Math.hypot(x, y);
    if (r < innerR - 10 || r > outerR + 40) return;
    let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
    const mins = round15(a / (Math.PI * 2) * 1440);
    onEmpty(minToStr(mins));
  };

  /* Drag-to-resize */
  const handlePointerDown = (e: React.PointerEvent, eventId: number, edge: "start" | "end") => {
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    setDragging({ eventId, edge });
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !svgRef.current) return;
    const [x, y] = svgXY(e);
    const r = Math.hypot(x, y);
    if (r < innerR || r > outerR + 60) return;
    let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
    const mins = round15(a / (Math.PI * 2) * 1440);
    const ev = events.find(e => e.id === dragging.eventId);
    if (!ev) return;
    if (dragging.edge === "start") {
      const endMin = toMin(ev.end);
      if (mins < endMin && endMin - mins >= 15) onDragEnd(ev.id, minToStr(mins), ev.end);
    } else {
      const startMin = toMin(ev.start);
      if (mins > startMin && mins - startMin >= 15) onDragEnd(ev.id, ev.start, minToStr(mins));
    }
  };
  const handlePointerUp = () => setDragging(null);

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

        {/* Heat map ring */}
        {heatMap && heatData.map((count, i) => {
          if (count === 0) return null;
          const a1 = (i / 96) * Math.PI * 2 - Math.PI / 2;
          const a2 = ((i + 1) / 96) * Math.PI * 2 - Math.PI / 2;
          const r = innerR - 6;
          const [x1, y1] = pt(r, a1);
          const [x2, y2] = pt(r, a2);
          const opacity = 0.08 + (count / maxHeat) * 0.35;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e55b5b" strokeWidth="10" opacity={opacity} strokeLinecap="round" />;
        })}

        {/* Outer dotted guide */}
        <circle cx={C} cy={C} r={outerR + 12} fill="none" stroke="var(--sketch-line)" strokeWidth="1.5" strokeDasharray="3 8" opacity="0.3" />

        {/* Hour ticks */}
        {Array.from({ length: 24 }, (_, h) => {
          const a = timeToAngle(h * 60); const main = h % 3 === 0; const len = main ? 16 : 8;
          const [x1, y1] = pt(outerR + 18, a); const [x2, y2] = pt(outerR + 18 + len, a);
          return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--sketch-line)" strokeWidth={main ? 1.8 : 1} strokeLinecap="round" opacity={main ? 0.6 : 0.25} />;
        })}

        {/* Hour labels */}
        {[6, 9, 12, 15, 18, 21].map(h => {
          const a = timeToAngle(h * 60); const [lx, ly] = pt(outerR + 40, a);
          const h12 = h % 12 || 12; const ap = h >= 12 ? "pm" : "am";
          return <text key={h} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="sketch-label" fontSize="11" fill="var(--sketch-muted)">{h12}{ap}</text>;
        })}

        {/* Wedge segments */}
        {events.map((ev, i) => {
          const s = timeToAngle(toMin(ev.start)); const e2 = timeToAngle(toMin(ev.end));
          const [ix1, iy1] = pt(innerR, s); const [ox1, oy1] = pt(outerR, s);
          const [ix2, iy2] = pt(innerR, e2); const [ox2, oy2] = pt(outerR, e2);
          const large = e2 - s > Math.PI ? 1 : 0;
          const d = `M ${ix1} ${iy1} L ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;
          const color = getColor(ev, palette);
          const fill = ev.category === "Commute" ? "url(#pat-stripe)" : ev.category === "Free" ? "url(#pat-dots)" : color;
          const midA = (s + e2) / 2; const midR = outerR + 50;
          const [lx, ly] = pt(midR, midA);
          const [ax, ay] = pt(outerR + 14, midA);
          const isSel = selected === ev.id;

          return (
            <g key={ev.id}>
              <motion.path d={d} fill={fill} stroke="var(--sketch-bg)" strokeWidth="2.5" strokeLinejoin="round"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="cursor-pointer" onClick={e => { e.stopPropagation(); onSelect(ev.id); }}
                style={{ transformOrigin: `${C}px ${C}px` }} />
              {/* Resize handles */}
              {isSel && <>
                <circle cx={ox1} cy={oy1} r="7" fill="var(--sketch-bg)" stroke={color} strokeWidth="2.5"
                  className="cursor-grab" onPointerDown={e => handlePointerDown(e, ev.id, "start")} />
                <circle cx={ox2} cy={oy2} r="7" fill="var(--sketch-bg)" stroke={color} strokeWidth="2.5"
                  className="cursor-grab" onPointerDown={e => handlePointerDown(e, ev.id, "end")} />
              </>}
              {/* Label */}
              <line x1={ax} y1={ay} x2={lx} y2={ly} stroke="var(--sketch-muted)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <text x={lx} y={ly - 8} textAnchor="middle" className="sketch-label" fontSize="12" fill="var(--sketch-fg)" fontWeight="600">{ev.title}</text>
              <text x={lx} y={ly + 8} textAnchor="middle" className="sketch-label" fontSize="9.5" fill="var(--sketch-muted)">{fmtTime(ev.start)} — {fmtTime(ev.end)}</text>
              <circle cx={ax} cy={ay} r="5" fill="var(--sketch-bg)" stroke="var(--sketch-line)" strokeWidth="1.8" />
            </g>
          );
        })}

        {/* Inner circle */}
        <circle cx={C} cy={C} r={innerR} fill="var(--sketch-bg)" stroke="var(--sketch-line)" strokeWidth="2.5" filter="url(#sketch)" />
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
  const [palette, setPalette] = useState<Record<Category, string>>(loadPalette);
  const [templates, setTemplates] = useState<Template[]>(loadTemplates);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [heatMap, setHeatMap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

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
  const updateColor = (cat: Category, color: string) => setPalette(p => ({ ...p, [cat]: color }));

  return (
    <main className="sketchbook">
      <div className="mx-auto flex min-h-screen max-w-[620px] flex-col px-5 pb-10 pt-6 sm:px-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <button onClick={() => setDate(new Date(2024, 9, 16))} className="sketch-link flex items-center gap-2 text-xl font-bold">
            thyme<span className="text-[#e55b5b]">.</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => setHeatMap(!heatMap)} className={`sketch-btn-icon size-8 ${heatMap ? "bg-[#e55b5b]/10 border-[#e55b5b]" : ""}`} title="Heat map">
              <svg viewBox="0 0 16 16" className="size-3.5"><rect x="1" y="10" width="3" height="5" rx="0.5" fill="currentColor" opacity=".3" /><rect x="5" y="7" width="3" height="8" rx="0.5" fill="currentColor" opacity=".6" /><rect x="9" y="4" width="3" height="11" rx="0.5" fill="currentColor" opacity=".8" /><rect x="13" y="1" width="3" height="14" rx="0.5" fill="currentColor" /></svg>
            </button>
            <button onClick={() => setDark(!dark)} className="sketch-btn-icon size-8" title="Toggle dark mode">
              {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
            <button onClick={() => setShowSettings(s => !s)} className="sketch-btn-icon size-8" title="Settings">⚙</button>
            <button onClick={async () => { await signOut(); navigate("/"); }} className="sketch-link flex items-center gap-1.5 text-xs">
              <LogOut className="size-3.5" /> sign out
            </button>
          </div>
        </header>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4">
              <div className="sketch-card">
                <p className="sketch-label text-xs mb-3">customize colors</p>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(palette) as Category[]).map(cat => (
                    <label key={cat} className="flex items-center gap-2 text-xs">
                      <input type="color" value={palette[cat]} onChange={e => updateColor(cat, e.target.value)}
                        className="size-6 cursor-pointer rounded border-0 bg-transparent" />
                      <span className="sketch-label">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => moveDay(-1)} className="sketch-btn-icon"><ChevronLeft className="size-5" /></button>
          <div className="text-center">
            <p className="sketch-label text-lg">{weekday}</p>
            <h1 className="sketch-title text-5xl mt-1">{date.getDate()} <span className="text-[var(--sketch-muted)]">{month}</span></h1>
            <p className="sketch-label text-xs mt-1 opacity-50">{date.getFullYear()}</p>
          </div>
          <button onClick={() => moveDay(1)} className="sketch-btn-icon"><ChevronRight className="size-5" /></button>
        </div>

        {/* Week dots */}
        <div className="mt-5 flex justify-center gap-3">
          {[-3, -2, -1, 0, 1, 2, 3].map(offset => {
            const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
            const isToday = offset === 0;
            const initial = d.toLocaleDateString("en-US", { weekday: "narrow" });
            return (
              <button key={offset} onClick={() => setDate(d)}
                className={`sketch-pill ${isToday ? "sketch-pill-active" : ""}`}>
                <span className="text-[10px] uppercase">{initial}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Circle */}
        <div className="mt-8">
          <SketchCircle events={events} selected={selected} onSelect={setSelected} palette={palette} heatMap={heatMap}
            onEmpty={time => setEditing({ id: 0, title: "", start: time, end: minToStr(clamp(toMin(time) + 45, 0, 1439)), category: "Study", note: "", repeat: [], color: undefined })}
            onDragEnd={handleDragEnd} />
        </div>

        {/* Legend */}
        <p className="mt-1 text-center text-[10px] uppercase tracking-[.18em] text-[var(--sketch-muted)] opacity-50">
          tap to select · drag edges to resize · tap empty to add
        </p>

        {/* Category legend */}
        <div className="mt-4 flex items-center justify-center gap-5 text-[9px] uppercase tracking-[.15em] text-[var(--sketch-muted)] opacity-60">
          {(Object.keys(palette) as Category[]).map(c => (
            <span key={c} className="flex items-center gap-1.5"><i className="size-2 rounded-sm" style={{ backgroundColor: palette[c] }} />{c}</span>
          ))}
        </div>

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
                <button onClick={() => setEditing(active)} className="sketch-btn"><Edit3 className="size-3.5" /> edit</button>
                <button onClick={() => addTemplate(active)} className="sketch-btn"><Bookmark className="size-3.5" /> save as template</button>
                <button onClick={() => remove(active.id)} className="sketch-btn sketch-btn-danger"><Trash2 className="size-3.5" /> remove</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FABs */}
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setShowTemplates(true)} className="sketch-btn"><Bookmark className="size-3.5" /> templates</button>
          <button onClick={() => setEditing({ id: 0, title: "", start: "12:00", end: "12:45", category: "Study", note: "", repeat: [], color: undefined })} className="sketch-fab">
            <Plus className="size-5" />
          </button>
        </div>

        {/* Template picker */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-5 backdrop-blur-[2px]">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="composer w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="sketch-title text-xl">templates</h2>
                  <button onClick={() => setShowTemplates(false)} className="sketch-btn-icon size-8"><X className="size-4" /></button>
                </div>
                {templates.length === 0 ? (
                  <p className="sketch-body text-sm opacity-50 py-6 text-center">no templates yet — create a block and save it as a template.</p>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {templates.map(t => (
                      <button key={t.id} onClick={() => applyTemplate(t)}
                        className="w-full flex items-center gap-3 rounded-xl border border-[var(--sketch-border)] p-3 text-left hover:bg-[var(--sketch-hover)] transition">
                        <span className="sketch-dot" style={{ backgroundColor: t.color || palette[t.category] }} />
                        <div className="flex-1 min-w-0">
                          <p className="sketch-title text-sm truncate">{t.title}</p>
                          <p className="sketch-label text-[10px]">{fmtTime(t.start)} — {fmtTime(t.end)} · {t.category}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setTemplates(list => list.filter(x => x.id !== t.id)); }}
                          className="text-[var(--sketch-muted)] opacity-40 hover:opacity-100"><Trash2 className="size-3" /></button>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Composer */}
      <AnimatePresence>
        {editing && <Composer event={editing} onClose={() => setEditing(null)} onSave={save} palette={palette} />}
      </AnimatePresence>
    </main>
  );
}

/* ── Composer ──────────────────────────────────────────────── */
function Composer({ event, onClose, onSave, palette }: { event: Event; onClose: () => void; onSave: (ev: Event) => void; palette: Record<Category, string> }) {
  const [title, setTitle] = useState(event.title);
  const [start, setStart] = useState(event.start);
  const [end, setEnd] = useState(event.end);
  const [category, setCategory] = useState<Category>(event.category);
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
      <motion.form initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        onSubmit={submit} className="composer">
        <div className="flex items-center justify-between mb-5">
          <h2 className="sketch-title text-2xl">{event.id ? "edit block" : "new block"}</h2>
          <button type="button" onClick={onClose} className="sketch-btn-icon size-8"><X className="size-4" /></button>
        </div>

        <label className="sketch-label text-xs">title</label>
        <Input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Chemistry lecture" className="sketch-input mt-1.5" required />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div><label className="sketch-label text-xs">start</label><Input type="time" value={start} onChange={e => setStart(e.target.value)} className="sketch-input mt-1.5" /></div>
          <div><label className="sketch-label text-xs">end</label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} className="sketch-input mt-1.5" /></div>
        </div>

        <label className="sketch-label text-xs mt-4 block">category</label>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {(Object.keys(palette) as Category[]).map(cat => (
            <button type="button" key={cat} onClick={() => { setCategory(cat); if (!useCustomColor) setColor(palette[cat]); }}
              className={`sketch-chip ${category === cat ? "sketch-chip-active" : ""}`}>
              <span className="sketch-dot" style={{ backgroundColor: palette[cat] }} />{cat}
            </button>
          ))}
        </div>

        {/* Custom color */}
        <label className="sketch-label text-xs mt-4 block">color</label>
        <div className="flex items-center gap-3 mt-1.5">
          <input type="color" value={color} onChange={e => { setColor(e.target.value); setUseCustomColor(true); }}
            className="size-7 cursor-pointer rounded border-0 bg-transparent" />
          <button type="button" onClick={() => { setUseCustomColor(false); setColor(palette[category]); }}
            className="sketch-label text-[10px] opacity-50 hover:opacity-100">reset to category default</button>
        </div>

        {/* Repeat */}
        <label className="sketch-label text-xs mt-4 block flex items-center gap-1.5">
          <Repeat className="size-3" /> repeat on
        </label>
        <div className="flex gap-1.5 mt-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map(d => (
            <button type="button" key={d} onClick={() => toggleRepeat(d)}
              className={`size-8 rounded-lg border text-[10px] font-medium transition ${repeat.includes(d) ? "bg-[var(--sketch-fg)] text-[var(--sketch-bg)] border-[var(--sketch-fg)]" : "border-[var(--sketch-border)] text-[var(--sketch-muted)] hover:border-[var(--sketch-fg)]"}`}>
              {dayNames[d]}
            </button>
          ))}
        </div>

        <label className="sketch-label text-xs mt-4 block">note</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="optional" className="sketch-input sketch-textarea mt-1.5" />

        <button type="submit" className="sketch-btn-primary mt-5 w-full">{event.id ? "save changes" : "add to my day"}</button>
      </motion.form>
    </motion.div>
  );
}
