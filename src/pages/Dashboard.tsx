import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit3, LogOut, Plus, X, Trash2, Dumbbell, BookOpen, Users, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

type Category = "Class" | "Study" | "Health" | "Life" | "Commute" | "Free";
type Event = { id: number; title: string; start: string; end: string; category: Category; note: string };

const palette: Record<Category, { fill: string; pattern: "solid" | "stripe" | "dots" }> = {
  Class: { fill: "#4caf50", pattern: "solid" },
  Study: { fill: "#ffc107", pattern: "solid" },
  Health: { fill: "#e91e63", pattern: "solid" },
  Life: { fill: "#9c27b0", pattern: "solid" },
  Commute: { fill: "#2196f3", pattern: "stripe" },
  Free: { fill: "#b0bec5", pattern: "dots" },
};
const categoryIcons: Record<Category, React.FC<{ className?: string }>> = { Class: BookOpen, Study: Sparkles, Health: Dumbbell, Life: Users, Commute: ChevronRight, Free: Sparkles };
const fallback = { fill: "#b0bec5", pattern: "solid" as const };
const getCat = (c: string) => (palette as Record<string, typeof palette[Category]>)[c] || fallback;

const defaultDay: Event[] = [
  { id: 1, title: "Pre-Calculus", start: "07:30", end: "08:30", category: "Class", note: "" },
  { id: 2, title: "Exercise", start: "08:30", end: "09:15", category: "Health", note: "" },
  { id: 3, title: "Government", start: "10:00", end: "11:00", category: "Class", note: "" },
  { id: 4, title: "Chemistry", start: "11:30", end: "12:30", category: "Class", note: "" },
  { id: 5, title: "Communication Arts", start: "12:45", end: "13:45", category: "Class", note: "" },
  { id: 6, title: "Transportation", start: "14:00", end: "14:30", category: "Commute", note: "" },
  { id: 7, title: "Pre-Calculus Assignment", start: "15:00", end: "16:00", category: "Study", note: "" },
  { id: 8, title: "Make Project Video", start: "16:15", end: "17:15", category: "Life", note: "" },
  { id: 9, title: "Take-Home Quiz", start: "17:30", end: "18:30", category: "Study", note: "" },
  { id: 10, title: "Free time", start: "19:00", end: "20:30", category: "Free", note: "" },
  { id: 11, title: "Daredevil", start: "20:30", end: "21:15", category: "Free", note: "" },
];

const validCats: Category[] = ["Class", "Study", "Health", "Life", "Commute", "Free"];
function sanitize(events: Event[]): Event[] { return events.map(e => ({ ...e, category: validCats.includes(e.category as Category) ? e.category : "Study" })); }
function readEvents(date: Date): Event[] { try { const raw = localStorage.getItem(`thyme-${date.toISOString().slice(0, 10)}`); return raw ? sanitize(JSON.parse(raw)) : (date.toDateString() === new Date(2024, 9, 16).toDateString() ? defaultDay : []); } catch { return []; } }
function writeEvents(date: Date, events: Event[]) { localStorage.setItem(`thyme-${date.toISOString().slice(0, 10)}`, JSON.stringify(events)); }
function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fmtTime(t: string) { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`; }
function dur(e: Event) { return toMin(e.end) - toMin(e.start); }

/* Sketchbook circle — wedges radiate outward like the hand-drawn reference */
function SketchCircle({
  events, selected, onSelect, onEmpty,
}: {
  events: Event[];
  selected: number | null;
  onSelect: (id: number) => void;
  onEmpty: (time: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const S = 620, C = S / 2, innerR = 120, outerR = 238;

  const timeToAngle = (mins: number) => (mins / 1440) * Math.PI * 2 - Math.PI / 2;
  const pt = (r: number, a: number) => [C + r * Math.cos(a), C + r * Math.sin(a)];

  const handleClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * S / rect.width - C;
    const y = (e.clientY - rect.top) * S / rect.height - C;
    const r = Math.hypot(x, y);
    if (r < innerR - 10 || r > outerR + 40) return;
    let a = Math.atan2(y, x) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    const mins = Math.round((a / (Math.PI * 2)) * 1440 / 15) * 15;
    const found = events.find(ev => mins >= toMin(ev.start) && mins < toMin(ev.end));
    if (found) onSelect(found.id);
    else onEmpty(`${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
  };

  /* Hour marks */
  const hours = Array.from({ length: 24 }, (_, i) => i);

  /* Wedge paths */
  const wedges = events.map(ev => {
    const s = timeToAngle(toMin(ev.start));
    const e2 = timeToAngle(toMin(ev.end));
    const [ix1, iy1] = pt(innerR, s);
    const [ox1, oy1] = pt(outerR, s);
    const [ix2, iy2] = pt(innerR, e2);
    const [ox2, oy2] = pt(outerR, e2);
    const large = e2 - s > Math.PI ? 1 : 0;
    return {
      ev,
      d: `M ${ix1} ${iy1} L ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`,
      midAngle: (s + e2) / 2,
      midR: outerR + 48,
    };
  });

  /* Pattern defs */
  const patternId = (cat: Category, type: string) => `pat-${cat}-${type}`;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${S} ${S}`} onClick={handleClick} className="w-full touch-manipulation">
      <defs>
        {/* Stripe pattern */}
        <pattern id={patternId("Commute", "stripe")} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <rect width="8" height="8" fill={palette.Commute.fill} />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#1a1a18" strokeWidth="2.5" />
        </pattern>
        {/* Dot pattern */}
        <pattern id={patternId("Free", "dots")} patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill={palette.Free.fill} />
          <circle cx="5" cy="5" r="2" fill="#1a1a18" />
        </pattern>
        {/* Paper texture filter */}
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
          <feBlend in="SourceGraphic" in2="gray" mode="multiply" />
        </filter>
        <filter id="sketch">
          <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.5" />
        </filter>
      </defs>

      {/* Outer dotted guide circle */}
      <circle cx={C} cy={C} r={outerR + 12} fill="none" stroke="#b8b4a8" strokeWidth="1.5" strokeDasharray="3 8" opacity="0.5" />

      {/* Hour tick marks */}
      {hours.map(h => {
        const a = timeToAngle(h * 60);
        const isMain = h % 3 === 0;
        const len = isMain ? 16 : 8;
        const [x1, y1] = pt(outerR + 18, a);
        const [x2, y2] = pt(outerR + 18 + len, a);
        return (
          <line key={h} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#8a8678" strokeWidth={isMain ? 1.8 : 1}
            strokeLinecap="round" opacity={isMain ? 0.7 : 0.35} />
        );
      })}

      {/* Hour labels */}
      {[6, 9, 12, 15, 18, 21].map(h => {
        const a = timeToAngle(h * 60);
        const [lx, ly] = pt(outerR + 40, a);
        const ampm = h >= 12 ? "pm" : "am";
        const h12 = h % 12 || 12;
        return (
          <text key={h} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            className="sketch-label" fontSize="11" fill="#6b6758">
            {h12}{ampm}
          </text>
        );
      })}

      {/* Wedge segments */}
      {wedges.map(({ ev, d, midAngle, midR }, i) => {
        const cat = getCat(ev.category);
        const fillId = cat.pattern === "stripe" ? `url(#${patternId("Commute", "stripe")})`
          : cat.pattern === "dots" ? `url(#${patternId("Free", "dots")})`
          : cat.fill;
        const [lx, ly] = pt(midR, midAngle);
        const [ax, ay] = pt(outerR + 14, midAngle);
        return (
          <g key={ev.id}>
            <motion.path
              d={d} fill={fillId} stroke="#1a1a18" strokeWidth="2.5"
              strokeLinejoin="round"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onSelect(ev.id); }}
              style={{ transformOrigin: `${C}px ${C}px` }}
            />
            {/* Label arrow line */}
            <line x1={ax} y1={ay} x2={lx} y2={ly}
              stroke="#6b6758" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            {/* Label text */}
            <text x={lx} y={ly - 8} textAnchor="middle"
              className="sketch-label" fontSize="12" fill="#3a3830" fontWeight="600">
              {ev.title}
            </text>
            {/* Time label */}
            <text x={lx} y={ly + 8} textAnchor="middle"
              className="sketch-label" fontSize="9.5" fill="#8a8678">
              {fmtTime(ev.start)} — {fmtTime(ev.end)}
            </text>
            {/* Small circles at start/end times like the sketch */}
            <circle cx={ax} cy={ay} r="5" fill="#faf8f0" stroke="#1a1a18" strokeWidth="1.8" />
          </g>
        );
      })}

      {/* Inner circle */}
      <circle cx={C} cy={C} r={innerR} fill="#faf8f0" stroke="#1a1a18" strokeWidth="2.5" filter="url(#sketch)" />
    </svg>
  );
}

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date(2024, 9, 16));
  const [events, setEvents] = useState<Event[]>(() => readEvents(new Date(2024, 9, 16)));
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<Event | null>(null);

  useEffect(() => { setEvents(readEvents(date)); setSelected(null); }, [date]);
  useEffect(() => { writeEvents(date, events); }, [events, date]);

  const active = events.find(e => e.id === selected) || null;
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const moveDay = (n: number) => setDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));

  const save = (ev: Event) => {
    setEvents(list => {
      const next = list.some(x => x.id === ev.id) ? list.map(x => x.id === ev.id ? ev : x) : [...list, ev];
      return next.sort((a, b) => toMin(a.start) - toMin(b.start));
    });
    setSelected(ev.id);
    setEditing(null);
  };
  const remove = (id: number) => { setEvents(list => list.filter(e => e.id !== id)); setSelected(null); };

  return (
    <main className="sketchbook">
      <div className="mx-auto flex min-h-screen max-w-[620px] flex-col px-5 pb-10 pt-6 sm:px-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <button onClick={() => setDate(new Date(2024, 9, 16))}
            className="sketch-link flex items-center gap-2 text-xl font-bold">
            thyme<span className="text-[#e55b5b]">.</span>
          </button>
          <button onClick={async () => { await signOut(); navigate("/"); }}
            className="sketch-link flex items-center gap-1.5 text-xs">
            <LogOut className="size-3.5" /> sign out
          </button>
        </header>

        {/* Day navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => moveDay(-1)}
            className="sketch-btn-icon"><ChevronLeft className="size-5" /></button>
          <div className="text-center">
            <p className="sketch-label text-lg">{weekday}</p>
            <h1 className="sketch-title text-5xl mt-1">{date.getDate()} <span className="text-[#8a8678]">{month}</span></h1>
            <p className="sketch-label text-xs mt-1 opacity-50">{date.getFullYear()}</p>
          </div>
          <button onClick={() => moveDay(1)}
            className="sketch-btn-icon"><ChevronRight className="size-5" /></button>
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

        {/* The big sketch circle */}
        <div className="mt-8">
          <SketchCircle
            events={events}
            selected={selected}
            onSelect={setSelected}
            onEmpty={time => {
              const endMins = (toMin(time) + 45) % 1440;
              setEditing({
                id: 0, title: "", start: time,
                end: `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`,
                category: "Study", note: "",
              });
            }}
          />
        </div>

        {/* Selected event detail — only shown below the circle when selected */}
        <AnimatePresence>
          {active && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="sketch-card mt-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="sketch-dot" style={{ backgroundColor: getCat(active.category).fill }} />
                    <span className="sketch-label text-xs uppercase">{active.category}</span>
                  </div>
                  <h3 className="sketch-title text-2xl">{active.title}</h3>
                  <p className="sketch-label text-sm mt-1">
                    {fmtTime(active.start)} — {fmtTime(active.end)} · {dur(active)} min
                  </p>
                </div>
              </div>
              {active.note && <p className="sketch-body text-sm mt-3 opacity-60">{active.note}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditing(active)} className="sketch-btn">
                  <Edit3 className="size-3.5" /> edit
                </button>
                <button onClick={() => remove(active.id)} className="sketch-btn sketch-btn-danger">
                  <Trash2 className="size-3.5" /> remove
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add button */}
        <button onClick={() => setEditing({
          id: 0, title: "", start: "12:00", end: "12:45",
          category: "Study", note: "",
        })} className="sketch-fab">
          <Plus className="size-5" />
        </button>

      </div>

      {/* Composer modal */}
      <AnimatePresence>
        {editing && <Composer event={editing} onClose={() => setEditing(null)} onSave={save} />}
      </AnimatePresence>
    </main>
  );
}

function Composer({ event, onClose, onSave }: { event: Event; onClose: () => void; onSave: (ev: Event) => void }) {
  const [title, setTitle] = useState(event.title);
  const [start, setStart] = useState(event.start);
  const [end, setEnd] = useState(event.end);
  const [category, setCategory] = useState<Category>(event.category);
  const [note, setNote] = useState(event.note);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || toMin(end) <= toMin(start)) return;
    onSave({ ...event, title: title.trim(), start, end, category, note });
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
        <Input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Chemistry lecture" className="sketch-input mt-1.5" required />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="sketch-label text-xs">start</label>
            <Input type="time" value={start} onChange={e => setStart(e.target.value)} className="sketch-input mt-1.5" />
          </div>
          <div>
            <label className="sketch-label text-xs">end</label>
            <Input type="time" value={end} onChange={e => setEnd(e.target.value)} className="sketch-input mt-1.5" />
          </div>
        </div>

        <label className="sketch-label text-xs mt-4 block">category</label>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {(Object.keys(palette) as Category[]).map(cat => (
            <button type="button" key={cat} onClick={() => setCategory(cat)}
              className={`sketch-chip ${category === cat ? "sketch-chip-active" : ""}`}>
              <span className="sketch-dot" style={{ backgroundColor: palette[cat].fill }} />
              {cat}
            </button>
          ))}
        </div>

        <label className="sketch-label text-xs mt-4 block">note</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          placeholder="optional"
          className="sketch-input sketch-textarea mt-1.5" />

        <button type="submit" className="sketch-btn-primary mt-5 w-full">
          {event.id ? "save changes" : "add to my day"}
        </button>
      </motion.form>
    </motion.div>
  );
}
