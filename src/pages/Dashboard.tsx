import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit3, LogOut, Plus, X, Trash2, Repeat, Bookmark, Sun, Moon, Calendar, RefreshCw, Unlink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";

/* ── Types ─────────────────────────────────────────────────── */
type Event = { id: number; title: string; start: string; end: string; category: string; note: string; repeat: number[]; color?: string };
type EnergyLog = { time: number; value: number; category?: string };
type Template = { id: number; title: string; start: string; end: string; category: string; note: string; color?: string };
type Palette = Record<string, string>;

/* ── Palette (defaults) ───────────────────────────────────── */
const builtInPalette: Palette = { Class: "#4caf50", Study: "#ffc107", Health: "#e91e63", Life: "#9c27b0", Commute: "#2196f3", Free: "#b0bec5" };
const fallbackColor = "#b0bec5";
const getColor = (ev: Event, palette: Palette) => ev.color || palette[ev.category] || fallbackColor;
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Helpers ───────────────────────────────────────────────── */
function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fmtTime(t: string) { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`; }
function dur(e: Event) { return toMin(e.end) - toMin(e.start); }
function keyFor(d: Date) { return `thyme-${d.toISOString().slice(0, 10)}`; }
function dowKey(d: Date) { return `thyme-dow-${d.getDay()}`; }
function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function round15(m: number) { return Math.round(m / 15) * 15; }
function roundToMinute(m: number) { return Math.round(m); }
function minToStr(m: number) { const h = Math.floor(m / 60) % 24; const mm = m % 60; return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`; }

/* ── Persistence ───────────────────────────────────────────── */
function sanitizeEvents(events: Event[]): Event[] { return events.map(e => ({ ...e, repeat: e.repeat || [], color: e.color })); }
function loadEvents(date: Date): Event[] {
  try {
    const raw = localStorage.getItem(keyFor(date));
    if (raw) return sanitizeEvents(JSON.parse(raw));
  } catch { /* ignore */ }
  if (date.toDateString() === new Date().toDateString()) return defaultDay;
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
function loadEnergy(date: Date): EnergyLog[] { try { return JSON.parse(localStorage.getItem(`thyme-energy-${date.toISOString().slice(0, 10)}`) || "[]"); } catch { return []; } }
function saveEnergy(date: Date, logs: EnergyLog[]) { localStorage.setItem(`thyme-energy-${date.toISOString().slice(0, 10)}`, JSON.stringify(logs)); }


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
  events, selected, onSelect, onEmpty, palette, heatMap, onDragEnd, locationEnabled, location,
}: {
  events: Event[]; selected: number | null; onSelect: (id: number | null) => void;
  onEmpty: (time: string) => void; palette: Palette;
  heatMap: boolean; onDragEnd: (id: number, newStart: string, newEnd: string) => void;
  locationEnabled: boolean; location: { latitude: number; longitude: number } | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const S = 620, C = S / 2, innerR = 120, outerR = 238;
  const timeToAngle = (mins: number) => (mins / 1440) * Math.PI * 2 - Math.PI / 2;
  const pt = (r: number, a: number) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  const [dragging, setDragging] = useState<{ eventId: number; edge: "start" | "end" } | null>(null);
  const draggingRef = useRef<{ eventId: number; edge: "start" | "end" } | null>(null);
  const justDraggedRef = useRef(false);
  const pathRefs = useRef<Map<number, SVGPathElement>>(new Map());
  const animAngles = useRef<Map<number, { start: number; end: number }>>(new Map());
  const animFrameRef = useRef<number>(0);
  const [, forceDragRender] = useState(0);
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
    /* Clicked empty space — dismiss any selected task detail */
    onSelect(null);
    const r = Math.hypot(x, y);
    if (r < innerR - 10 || r > outerR + 90) return;
    let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
    const mins = clamp(roundToMinute(a / (Math.PI * 2) * 1440), 0, 1439);
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
    const nextDragging = { eventId, edge } as const;
    draggingRef.current = nextDragging;
    setDragging(nextDragging);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    const activeDrag = draggingRef.current;
    if (!activeDrag || !svgRef.current) return;
    const [x, y] = svgXY(e);
    const r = Math.hypot(x, y);
    if (r < innerR || r > outerR + 60) return;
    let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
    const mins = clamp(roundToMinute(a / (Math.PI * 2) * 1440), 0, 1439);
    const ev = events.find(ev2 => ev2.id === activeDrag.eventId);
    if (!ev) return;
    const cur = animAngles.current.get(ev.id);
    if (!cur) return;
    const startMin = cur.start; const endMin = cur.end;
    let newStart = startMin, newEnd = endMin;
    if (activeDrag.edge === "start") {
      if (mins < endMin && endMin - mins >= 1) newStart = mins;
    } else {
      if (mins > startMin && mins - startMin >= 1) newEnd = mins;
    }
    if (newStart !== startMin || newEnd !== endMin) {
      animAngles.current.set(ev.id, { start: newStart, end: newEnd });
      forceDragRender(t => t + 1);
    }
  };
  const handlePointerUp = () => {
    const finishedDrag = draggingRef.current;
    if (finishedDrag) {
      justDraggedRef.current = true;
      draggingRef.current = null;
      const ev = events.find(ev2 => ev2.id === finishedDrag.eventId);
      const cur = ev ? animAngles.current.get(ev.id) : null;
      if (ev && cur) {
        /* The drag preview is already snapped on every pointer move. Commit
           exactly that preview; re-snapping from a stale event is what caused
           the end time to jump back by a slot after release. */
        const snapS = cur.start; const snapE = cur.end;
        /* Animate bounce-back to snapped position */
        const targetStart = snapS, targetEnd = snapE;
        let frameS = cur.start, frameE = cur.end;
        const animate = () => {
          frameS = springLerp(frameS, targetStart, 0.2);
          frameE = springLerp(frameE, targetEnd, 0.2);
          forceDragRender(t => t + 1);
          if (Math.abs(frameS - targetStart) > 0.05 || Math.abs(frameE - targetEnd) > 0.05) {
            animFrameRef.current = requestAnimationFrame(animate);
          } else {
            animAngles.current.set(ev.id, { start: targetStart, end: targetEnd });
            forceDragRender(t => t + 1);
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
    <div className="relative mx-auto aspect-square w-full max-w-[620px] overflow-visible">
      <svg ref={svgRef} viewBox={`0 0 ${S} ${S}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}
        shapeRendering="geometricPrecision"
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
        </defs>

        {/* Location-aware daylight markers: sunrise/sunset are estimated from the saved latitude. */}
        {(() => {
          const latitude = locationEnabled ? (location?.latitude ?? 40) : 40;
          const seasonal = Math.sin(((dayOfYear(new Date()) - 80) / 365) * Math.PI * 2);
          const daylight = 12 + Math.max(-2, Math.min(2, latitude / 45)) * seasonal * 2;
          const sunrise = Math.round((12 - daylight / 2) * 60);
          const sunset = Math.round((12 + daylight / 2) * 60);
          return <>
            <line x1={pt(outerR + 5, timeToAngle(sunrise))[0]} y1={pt(outerR + 5, timeToAngle(sunrise))[1]} x2={pt(outerR + 30, timeToAngle(sunrise))[0]} y2={pt(outerR + 30, timeToAngle(sunrise))[1]} stroke="#f2b84b" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
            <line x1={pt(outerR + 5, timeToAngle(sunset))[0]} y1={pt(outerR + 5, timeToAngle(sunset))[1]} x2={pt(outerR + 30, timeToAngle(sunset))[0]} y2={pt(outerR + 30, timeToAngle(sunset))[1]} stroke="#5d6680" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
          </>;
        })()}
        {/* Outer dotted guide */}
        <circle cx={C} cy={C} r={outerR + 12} fill="none" stroke="var(--sketch-line)" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" opacity="0.5" shapeRendering="geometricPrecision" />

        {/* Hour ticks */}
        {Array.from({ length: 24 }, (_, h) => {
          const a = timeToAngle(h * 60); const main = h % 3 === 0; const len = main ? 18 : 10;
          const [x1, y1] = pt(outerR + 18, a); const [x2, y2] = pt(outerR + 18 + len, a);
          return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--sketch-line)" strokeWidth={main ? 2.2 : 1.2} strokeLinecap="round" opacity={main ? 0.8 : 0.4} shapeRendering="geometricPrecision" />;
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
          /* During a drag, the preview geometry is intentionally local to the
             wheel. Never use it for labels: doing so makes the displayed time
             race through every pointer frame and can make narrow blocks vanish. */
          const sMin = a ? a.start : toMin(ev.start);
          const eMin = a ? a.end : toMin(ev.end);
          const labelStart = toMin(ev.start);
          const labelEnd = toMin(ev.end);
          const d = buildPath(sMin, eMin);
          const color = getColor(ev, palette);
          const fill = ev.category === "Commute" ? "url(#pat-stripe)" : ev.category === "Free" ? "url(#pat-dots)" : color;
          const s = timeToAngle(sMin); const e2 = timeToAngle(eMin);
          const [ox1, oy1] = pt(outerR, s); const [ox2, oy2] = pt(outerR, e2);
          const midA = (s + e2) / 2;
          /* Spread labels outward based on proximity to other labels */
          const gap = Math.abs(toMin(ev.end) - toMin(ev.start));
          /* ── Angular collision avoidance ── */
          /* Pre-compute all label angles once; for each event, check overlap
             with other labels and stagger across radius lanes. */
          const sortedAngles = events.map(o => ({ id: o.id, angle: timeToAngle((toMin(o.start) + toMin(o.end)) / 2) }));
          sortedAngles.sort((a, b) => a.angle - b.angle);
          const midDeg = (midA * 180) / Math.PI;
          const nearbyLabels = sortedAngles.filter(o => {
            if (o.id === ev.id) return false;
            const oDeg = (o.angle * 180) / Math.PI;
            let diff = Math.abs(midDeg - oDeg);
            if (diff > 180) diff = 360 - diff;
            return diff < 10;
          });
          const laneCount = nearbyLabels.length;
          /* Hide label entirely for very short segments when crowded */
          if (gap < 15 && laneCount > 1) return null;
          /* Pick a radius lane: base + offset for each overlapping neighbor */
          const laneOffset = laneCount * 22;
          const baseR = outerR + 88;
          const midR = baseR + laneOffset;
          /* Jitter left/right to avoid stacking on the same ray */
          const jitterAngle = midA + (laneCount * 0.04 - 0.06);
          const [rawLx, rawLy] = pt(midR, jitterAngle);
          const lx = clamp(rawLx, 55, S - 55);
          const ly = clamp(rawLy, 42, S - 42);
          const [ax, ay] = pt(outerR + 18, midA);
          const isSel = selected === ev.id;
          const isDraggingThis = dragging?.eventId === ev.id;

          return (
            <g key={ev.id}>
              <motion.path ref={getPathRef(ev.id) as (el: any) => void}
                d={d} fill={fill} stroke="var(--sketch-bg)" strokeWidth="1.5"
                shapeRendering="geometricPrecision"
                initial={false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0 }}
                whileHover={{ scale: isSel ? 1 : 1.01 }}
                className="cursor-pointer" onClick={e => { e.stopPropagation(); onSelect(ev.id); }}
                style={{ transformOrigin: `${C}px ${C}px` }} />
              {/* Resize handles */}
              {isSel && <>
                {/* Animated pulse ring on active drag handle */}
                {isDraggingThis && <circle cx={dragging?.edge === "start" ? ox1 : ox2} cy={dragging?.edge === "start" ? oy1 : oy2} r="14" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" shapeRendering="geometricPrecision">
                  <animate attributeName="r" values="11;16;11" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.15;0.4" dur="1s" repeatCount="indefinite" />
                </circle>}
                <circle cx={ox1} cy={oy1} r="8" fill="var(--sketch-bg)" stroke={color} strokeWidth="2.5" shapeRendering="geometricPrecision"
                  className="cursor-grab active:cursor-grabbing" onPointerDown={e => handlePointerDown(e, ev.id, "start")} />
                <circle cx={ox2} cy={oy2} r="8" fill="var(--sketch-bg)" stroke={color} strokeWidth="2.5" shapeRendering="geometricPrecision"
                  className="cursor-grab active:cursor-grabbing" onPointerDown={e => handlePointerDown(e, ev.id, "end")} />
              </>}
              {/* Label */}
              <line x1={ax} y1={ay} x2={lx} y2={ly} stroke="var(--sketch-fg)" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" opacity="0.35" shapeRendering="geometricPrecision" />
              {/* Title — SA Long Beach for soft, personal handwriting look */}
              <text x={lx} y={ly - (gap >= 30 ? 11 : 8)} textAnchor="middle" fontFamily="'SA Long Beach', 'Caveat', cursive" fontSize={gap >= 60 ? "13" : gap >= 30 ? "11" : "10"} fill="var(--sketch-fg)" fontWeight="600" style={{ letterSpacing: '0.02em' }}>{gap < 30 ? ev.title.split(' ').slice(0, 2).join(' ') : ev.title}</text>
              {/* Time sits on its own baseline — only show for segments ≥ 20 min */}
              {gap >= 20 && <text x={lx} y={ly + (gap >= 30 ? 11 : 9)} textAnchor="middle" fontFamily="'SA Long Beach', 'Caveat', cursive" fontSize={gap >= 60 ? "11" : "10"} fill="var(--sketch-fg)" fontWeight="600" opacity="0.95">{fmtTime(minToStr(labelStart))} - {fmtTime(minToStr(labelEnd))}</text>}
              <circle cx={ax} cy={ay} r="4" fill="var(--sketch-bg)" stroke="var(--sketch-fg)" strokeWidth="2" opacity="0.6" shapeRendering="geometricPrecision" />
            </g>
          );
        })}

        {/* Inner circle */}
        <circle cx={C} cy={C} r={innerR} fill="var(--sketch-bg)" stroke="var(--sketch-line)" strokeWidth="2.5" shapeRendering="geometricPrecision" />

        {/* Heat map ring (rendered on top) */}
        {heatMap && heatData.map((count, i) => {
          if (count === 0) return null;
          const mid = ((i + 0.5) / 96) * Math.PI * 2 - Math.PI / 2;
          const r = innerR + 18;
          const [cx, cy] = pt(r, mid);
          const opacity = 0.2 + (count / maxHeat) * 0.6;
          const size = 3 + (count / maxHeat) * 5;
          return <circle key={`heat-${i}`} cx={cx} cy={cy} r={size} fill="#e55b5b" opacity={opacity} shapeRendering="geometricPrecision" />;
        })}

        {/* Now indicator — pulsing red dot on the inner ring at current time */}
        {(() => {
          const now = new Date();
          const nowMins = now.getHours() * 60 + now.getMinutes();
          const a = timeToAngle(nowMins);
          const nowR = innerR + 14;
          const latitude = locationEnabled ? (location?.latitude ?? 40) : 40;
          const seasonal = Math.sin(((dayOfYear(now) - 80) / 365) * Math.PI * 2);
          const daylight = 12 + Math.max(-2, Math.min(2, latitude / 45)) * seasonal * 2;
          const sunrise = (12 - daylight / 2) * 60;
          const sunset = (12 + daylight / 2) * 60;
          const isDaylight = nowMins >= sunrise && nowMins <= sunset;
          const indicatorColor = isDaylight ? "#f2b84b" : "#7180b5";
          const [nx, ny] = pt(nowR, a);
          return (
            <g>
              {/* Glow ring behind the dot */}
              <circle cx={nx} cy={ny} r="12" fill="none" stroke={indicatorColor} strokeWidth="1.5" opacity="0.3" shapeRendering="geometricPrecision">
                <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Main dot — larger, more visible */}
              <circle cx={nx} cy={ny} r="6" fill={indicatorColor} shapeRendering="geometricPrecision">
                <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Inner highlight */}
              <circle cx={nx} cy={ny} r="2.5" fill="#fff" opacity="0.7" shapeRendering="geometricPrecision" />
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
  const [date, setDate] = useState(() => new Date());
  const [events, setEvents] = useState<Event[]>(() => loadEvents(new Date()));
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<Event | null>(null);
  const [palette, setPalette] = useState<Palette>(loadPalette);
  const [templates, setTemplates] = useState<Template[]>(loadTemplates);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [heatMap, setHeatMap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Event | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(() => localStorage.getItem("thyme-location-enabled") === "true");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(() => { try { const raw = localStorage.getItem("thyme-location"); return raw ? JSON.parse(raw) : null; } catch { return null; } });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const gCal = useGoogleCalendar(date);
  useEffect(() => {
    if (!locationEnabled) return;
    if (!navigator.geolocation) { setLocationEnabled(false); setLocationError("location is not available"); return; }
    setLocating(true); setLocationError("");
    navigator.geolocation.getCurrentPosition(pos => {
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setLocation(next); localStorage.setItem("thyme-location", JSON.stringify(next)); setLocating(false);
    }, () => { setLocating(false); setLocationEnabled(false); localStorage.setItem("thyme-location-enabled", "false"); setLocationError("location permission denied"); }, { timeout: 8000 });
  }, [locationEnabled]);

  const dayKey = date.toISOString().slice(0, 10);
  const cloudEvents = useQuery(api.planner.listEvents, { day: dayKey });
  const cloudTemplates = useQuery(api.planner.listTemplates);
  const cloudPalette = useQuery(api.planner.getPalette);
  const upsertCloudEvent = useMutation(api.planner.upsertEvent);
  const deleteCloudEvent = useMutation(api.planner.deleteEvent);
  const replaceDayEvents = useMutation(api.planner.replaceDayEvents);
  const upsertCloudTemplate = useMutation(api.planner.upsertTemplate);
  const deleteCloudTemplate = useMutation(api.planner.deleteTemplate);
  const replaceTemplates = useMutation(api.planner.replaceTemplates);
  const setCloudPalette = useMutation(api.planner.setPalette);
  const [cloudReady, setCloudReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const currentUser = useQuery(api.users.currentUser);
  const onboardedMutation = useMutation(api.planner.setOnboarded);
  const pendingDragRef = useRef<{ id: number; start: string; end: string } | null>(null);

  useEffect(() => {
    if (cloudEvents === undefined) return;
    const next = cloudEvents.map(({ eventId, title, start, end, category, note, repeat, color }) => ({ id: eventId, title, start, end, category, note, repeat, color }));
    if (cloudReady) setEvents(next.sort((a, b) => toMin(a.start) - toMin(b.start)));
    else if (cloudEvents.length === 0) { const userOnboarded = currentUser?.onboarded; if (userOnboarded === false || (userOnboarded === undefined && currentUser !== null)) { setShowOnboarding(true); } else { void replaceDayEvents({ day: dayKey, events: loadEvents(date).map(e => ({ eventId: e.id, day: dayKey, title: e.title, start: e.start, end: e.end, category: e.category, note: e.note, repeat: e.repeat || [], color: e.color })) }); } }
    setCloudReady(true);
  }, [cloudEvents, cloudReady, date, dayKey, replaceDayEvents, currentUser]);
  useEffect(() => { if (cloudReady) saveEvents(date, events); }, [events, date, cloudReady]);
  /* One-time import: seed cloud from localStorage on first load, then cloud is the source of truth. */
  useEffect(() => {
    if (!cloudTemplates) return;
    if (cloudTemplates.length === 0) {
      void replaceTemplates({ templates: loadTemplates().map(t => ({ templateId: t.id, title: t.title, start: t.start, end: t.end, category: t.category, note: t.note, color: t.color })) });
    } else {
      setTemplates(cloudTemplates.map(({ templateId, title, start, end, category, note, color }) => ({ id: templateId, title, start, end, category, note, color })));
    }
  }, [cloudTemplates, replaceTemplates]);
  useEffect(() => { if (cloudPalette?.colors) setPalette({ ...builtInPalette, ...(cloudPalette.colors as Palette) }); }, [cloudPalette]);
  useEffect(() => { savePalette(palette); if (cloudReady) void setCloudPalette({ colors: palette }); }, [palette, cloudReady, setCloudPalette]);
  useEffect(() => { saveTemplates(templates); }, [templates]);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);      const active = events.find(e => e.id === selected) || null;
  const activeDetail = active && pendingDragRef.current?.id === active.id
    ? { ...active, start: pendingDragRef.current.start, end: pendingDragRef.current.end }
    : active;
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const moveDay = (n: number) => setDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));

  const save = (ev: Event) => {
    setEvents(list => {
      const next = list.some(x => x.id === ev.id) ? list.map(x => x.id === ev.id ? ev : x) : [...list, ev];
      return next.sort((a, b) => toMin(a.start) - toMin(b.start));
    });
    void upsertCloudEvent({ eventId: ev.id, day: dayKey, title: ev.title, start: ev.start, end: ev.end, category: ev.category, note: ev.note, repeat: ev.repeat || [], color: ev.color });
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
    const deleted = events.find(e => e.id === id);
    if (!deleted) return;
    setPendingDelete(deleted);
  };
  const confirmRemove = () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setEvents(list => list.filter(e => e.id !== id));
    void deleteCloudEvent({ day: dayKey, eventId: id });
    /* Clean up repeating storage */
    for (let i = 0; i < 7; i++) {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + i);
      const key = dowKey(d);
      try { const existing: Event[] = JSON.parse(localStorage.getItem(key) || "[]"); localStorage.setItem(key, JSON.stringify(existing.filter(e => e.id !== id))); } catch { /* */ }
    }
    setSelected(null);
    setPendingDelete(null);
  };
  const handleDragEnd = (id: number, newStart: string, newEnd: string) => {
    pendingDragRef.current = { id, start: newStart, end: newEnd };
    const updated = events.find(e => e.id === id);
    if (updated) void upsertCloudEvent({ eventId: id, day: dayKey, title: updated.title, start: newStart, end: newEnd, category: updated.category, note: updated.note, repeat: updated.repeat || [], color: updated.color });
    setEvents(list => list.map(e => e.id === id ? { ...e, start: newStart, end: newEnd } : e).sort((a, b) => toMin(a.start) - toMin(b.start)));
    window.setTimeout(() => {
      if (pendingDragRef.current?.id === id) pendingDragRef.current = null;
    }, 0);
  };
  const addTemplate = (ev: Event) => {
    const t: Template = { id: Date.now(), title: ev.title, start: ev.start, end: ev.end, category: ev.category, note: ev.note, color: ev.color };
    setTemplates(list => [...list, t]);
    void upsertCloudTemplate({ templateId: t.id, title: t.title, start: t.start, end: t.end, category: t.category, note: t.note, color: t.color });
  };
  const applyTemplate = (t: Template) => {
    setEditing({ id: Date.now(), title: t.title, start: t.start, end: t.end, category: t.category, note: t.note, repeat: [], color: t.color });
    setShowTemplates(false);
  };
  const updateColor = (cat: string, color: string) => setPalette(p => ({ ...p, [cat]: color }));
  const addCategory = (name: string) => { if (name.trim() && !palette[name.trim()]) { setPalette(p => ({ ...p, [name.trim()]: fallbackColor })); } };
  const removeCategory = (cat: string) => { setPalette(p => { const { [cat]: _, ...rest } = p; return rest; }); };
  const [newCatName, setNewCatName] = useState("");
  return (
    <main className="sketchbook">
      <div className="mx-auto flex min-h-screen max-w-[620px] flex-col px-5 pb-10 pt-6 sm:px-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center justify-between">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setDate(new Date())} className="sketch-link flex items-center gap-2 text-xl font-bold">
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
            {gCal.isConnected && (
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                onClick={() => gCal.syncEnabled ? gCal.setSyncEnabled(false) : gCal.setSyncEnabled(true)}
                className={`sketch-btn-icon size-8 ${gCal.syncEnabled ? "bg-[#4caf50]/10 border-[#4caf50]" : ""}`} title="Google Calendar sync">
                <Calendar className="size-3.5" />
              </motion.button>
            )}
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
                <div className="mb-4 rounded-lg border border-[var(--sketch-border)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="sketch-label text-[11px]">location-based daylight</p>
                      <p className="sketch-body text-[10px] opacity-60">Uses your approximate location to estimate sunrise and sunset on the time wheel.</p>
                    </div>
                    <motion.button type="button" whileTap={{ scale: 0.96 }} aria-pressed={locationEnabled} aria-label="Toggle location-based daylight" onClick={() => { const next = !locationEnabled; setLocationError(""); setLocationEnabled(next); localStorage.setItem("thyme-location-enabled", String(next)); }} className={`group relative flex h-10 min-w-[132px] items-center justify-between rounded-xl border px-3 text-[10px] uppercase tracking-[0.12em] shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5a93d] focus-visible:ring-offset-2 ${locationEnabled ? "border-[#e5a93d] bg-[#e5a93d] text-white shadow-[#e5a93d]/25" : "border-[var(--sketch-border)] bg-[var(--sketch-bg)] text-[var(--sketch-muted)]"}`}>
                      <span className="flex items-center gap-2"><span className={`flex size-5 items-center justify-center rounded-md bg-white/90 text-[11px] font-bold ${locationEnabled ? "text-[#b47a19]" : "text-transparent"}`}>✓</span><span>{locationEnabled ? "enabled" : "location"}</span></span>
                      <span className={`ml-2 h-1.5 w-1.5 rounded-full ${locationEnabled ? "bg-white" : "bg-[var(--sketch-muted)] opacity-50"}`} />
                    </motion.button>
                  </div>
                  {locating && <p className="sketch-label mt-2 text-[10px] opacity-60">locating...</p>}
                  {locationError && <p className="sketch-label mt-2 text-[10px] text-[#e55b5b]">{locationError}</p>}
                  {locationEnabled && location && <button type="button" onClick={() => { setLocation(null); localStorage.removeItem("thyme-location"); }} className="sketch-label mt-2 text-[10px] text-[#e55b5b] hover:underline">clear saved location</button>}
                </div>
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

                {/* Google Calendar */}
                <div className="mt-5 pt-4 border-t border-[var(--sketch-border)]">
                  <p className="sketch-label text-xs mb-3 flex items-center gap-1.5">
                    <Calendar className="size-3" /> google calendar
                  </p>
                  {!gCal.hasClientId ? (
                    <GoogleClientIdInput />
                  ) : !gCal.isConnected ? (
                    <div>
                      <p className="sketch-body text-[11px] mb-3 opacity-60">connect your google calendar to sync events in and out of thyme.</p>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={gCal.signIn} className="sketch-btn w-full justify-center gap-2">
                        <Calendar className="size-3.5" /> connect google calendar
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="sketch-label text-[11px]">connected</span>
                        <span className="sketch-label text-[10px] text-[#4caf50]">● live</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="sketch-label text-[11px]">sync enabled</span>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => gCal.setSyncEnabled(!gCal.syncEnabled)}
                          className={`w-10 h-5 rounded-full transition-colors relative ${gCal.syncEnabled ? "bg-[#4caf50]" : "bg-[var(--sketch-border)]"}`}>
                          <motion.div animate={{ x: gCal.syncEnabled ? 20 : 2 }}
                            className="absolute top-0.5 size-4 rounded-full bg-white shadow" />
                        </motion.button>
                      </div>
                      {gCal.syncEnabled && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          className="space-y-2">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              const pulled = await gCal.pullEvents(date);
                              if (pulled.length > 0) {
                                setEvents(prev => {
                                  const merged = [...prev];
                                  pulled.forEach(pe => {
                                    if (!merged.some(e => e.title === pe.title && e.start === pe.start)) {
                                      merged.push(pe);
                                    }
                                  });
                                  return merged.sort((a, b) => toMin(a.start) - toMin(b.start));
                                });
                              }
                            }}
                            className="sketch-btn w-full justify-center gap-2" disabled={gCal.isSyncing}>
                            <RefreshCw className={`size-3.5 ${gCal.isSyncing ? "animate-spin" : ""}`} />
                            {gCal.isSyncing ? "syncing..." : "pull from google"}
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => gCal.pushAllEvents(events, date)}
                            className="sketch-btn w-full justify-center gap-2" disabled={gCal.isSyncing}>
                            <Calendar className="size-3.5" /> push to google
                          </motion.button>
                        </motion.div>
                      )}
                      {gCal.lastSyncTime && (
                        <p className="sketch-label text-[9px] opacity-40">last sync: {gCal.lastSyncTime}</p>
                      )}
                      {gCal.error && (
                        <p className="sketch-label text-[10px] text-[#e55b5b]">{gCal.error}</p>
                      )}
                      <button onClick={gCal.signOut} className="sketch-label text-[10px] opacity-40 hover:opacity-100 hover:text-[#e55b5b] flex items-center gap-1">
                        <Unlink className="size-3" /> disconnect
                      </button>
                    </div>
                  )}
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
            onEmpty={time => setEditing({ id: Date.now(), title: "", start: time, end: minToStr(clamp(toMin(time) + 45, 0, 1439)), category: "Study", note: "", repeat: [], color: undefined })}
            locationEnabled={locationEnabled} location={location} onDragEnd={handleDragEnd} />
        </motion.div>


        {/* Legend */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.4 }}
          className="mt-10 text-center text-[10px] uppercase tracking-[.18em] text-[var(--sketch-muted)]">
          tap to select · drag edges to resize · tap empty to add
        </motion.p>

        {/* Category legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.45 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[9px] uppercase tracking-[.15em] text-[var(--sketch-muted)]">
          {Object.keys(palette).map(c => (
            <span key={c} className="flex items-center gap-1.5"><i className="size-2 rounded-sm" style={{ backgroundColor: palette[c] }} />{c}</span>
          ))}
        </motion.div>

        {/* Selected detail */}
        <AnimatePresence>
          {activeDetail && (
            <motion.div key={`detail-${activeDetail.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="sketch-card mt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="sketch-dot" style={{ backgroundColor: getColor(activeDetail, palette) }} />
                    <span className="sketch-label text-xs uppercase">{activeDetail.category}</span>
                    {(activeDetail.repeat || []).length > 0 && <Repeat className="size-3 opacity-40" />}
                  </div>
                  <h3 className="sketch-title text-2xl">{activeDetail.title}</h3>
                  <p className="sketch-label text-sm mt-1">{fmtTime(activeDetail.start)} — {fmtTime(activeDetail.end)} · {dur(activeDetail)} min</p>
                  {(activeDetail.repeat || []).length > 0 && (
                    <p className="sketch-label text-[10px] mt-1 opacity-50">repeats {(activeDetail.repeat || []).map((d: number) => dayNames[d]).join(", ")}</p>
                  )}
                </div>
              </div>
              {activeDetail.note && <p className="sketch-body text-sm mt-3 opacity-60">{activeDetail.note}</p>}
              <div className="flex gap-2 mt-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setEditing(activeDetail)} className="sketch-btn"><Edit3 className="size-3.5" /> edit</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => addTemplate(activeDetail)} className="sketch-btn"><Bookmark className="size-3.5" /> save as template</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => remove(activeDetail.id)} className="sketch-btn sketch-btn-danger"><Trash2 className="size-3.5" /> remove</motion.button>
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
            onClick={() => setEditing({ id: Date.now(), title: "", start: "12:00", end: "12:45", category: "Study", note: "", repeat: [], color: undefined })} className="sketch-fab">
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
                        <button onClick={e => { e.stopPropagation(); setTemplates(list => list.filter(x => x.id !== t.id)); void deleteCloudTemplate({ templateId: t.id }); }}
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
        {/* Onboarding overlay */}
<AnimatePresence>
  {showOnboarding && currentUser && (
    <OnboardingView onChoose={(chosenEvents) => {
      const today = new Date();
      const dk = today.toISOString().slice(0, 10);
      void replaceDayEvents({ day: dk, events: chosenEvents.map(e => ({ eventId: e.id, day: dk, title: e.title, start: e.start, end: e.end, category: e.category, note: e.note, repeat: e.repeat || [], color: e.color })) });
      void onboardedMutation();
      setEvents(chosenEvents);
      setShowOnboarding(false);
      localStorage.setItem("thyme-onboarded", "true");
    }} />
  )}
</AnimatePresence>

{showStats && <StatsView onClose={() => setShowStats(false)} palette={palette} currentDate={date} />}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-5 backdrop-blur-[2px]"
            onClick={e => { if (e.target === e.currentTarget) setPendingDelete(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              role="dialog" aria-modal="true" aria-labelledby="delete-title"
              className="composer w-full max-w-sm">
              <h2 id="delete-title" className="sketch-title text-2xl">are you sure?</h2>
              <p className="sketch-body mt-2 text-sm opacity-65">Delete “{pendingDelete.title}” from this day?</p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setPendingDelete(null)} className="sketch-btn">cancel</button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={confirmRemove} className="sketch-btn sketch-btn-danger">delete</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <AnimatePresence>
        {editing && <Composer event={editing} onClose={() => setEditing(null)} onSave={save} palette={palette} />}
      </AnimatePresence>
    </main>
  );
}

/* ── Google Client ID Setup ───────────────────────────────── */
function GoogleClientIdInput() {
  const [clientId, setClientId] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (clientId.trim().length > 10) {
      localStorage.setItem("thyme_google_client_id", clientId.trim());
      setSaved(true);
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div>
      <p className="sketch-body text-[11px] mb-2 opacity-60">paste your google oauth client id to enable calendar sync.</p>
      <div className="rounded-lg border border-[var(--sketch-border)] bg-[var(--sketch-hover)] p-3 mb-3">
        <p className="sketch-label text-[10px] font-medium mb-1">how to get it:</p>
        <ol className="sketch-body text-[10px] opacity-60 space-y-1 list-decimal pl-3">
          <li>go to <span className="font-medium">console.cloud.google.com</span></li>
          <li>create project → enable <span className="font-medium">Google Calendar API</span></li>
          <li>credentials → create <span className="font-medium">OAuth 2.0 Client ID</span> (Web app)</li>
          <li>add your app URL to authorized JavaScript origins</li>
        </ol>
      </div>
      {saved ? (
        <p className="sketch-label text-[11px] text-[#4caf50]">saved! reloading...</p>
      ) : (
        <div className="flex gap-2">
          <Input value={clientId} onChange={e => setClientId(e.target.value)}
            placeholder="xxxx.apps.googleusercontent.com"
            className="sketch-input flex-1 text-[11px]" />
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave} className="sketch-btn text-[11px]">save</motion.button>
        </div>
      )}
    </div>
  );
}


/* ── Onboarding View ────────────────────────────────────── */

type StarterPack = { id: string; name: string; icon: string; desc: string; events: Event[] };

const starterPacks: StarterPack[] = [
  { id: "student", name: "student", icon: "🎓", desc: "classes, study sessions, and breaks",
    events: [
      { id: 1, title: "Pre-Calculus", start: "07:30", end: "08:30", category: "Class", note: "", repeat: [], color: undefined },
      { id: 2, title: "Exercise", start: "08:45", end: "09:30", category: "Health", note: "", repeat: [], color: undefined },
      { id: 3, title: "Government", start: "10:00", end: "11:00", category: "Class", note: "", repeat: [], color: undefined },
      { id: 4, title: "Chemistry", start: "11:30", end: "12:30", category: "Class", note: "", repeat: [], color: undefined },
      { id: 5, title: "Communication Arts", start: "12:45", end: "13:45", category: "Class", note: "", repeat: [], color: undefined },
      { id: 6, title: "Commute", start: "14:00", end: "14:30", category: "Commute", note: "", repeat: [], color: undefined },
      { id: 7, title: "Study Session", start: "15:00", end: "16:30", category: "Study", note: "", repeat: [], color: undefined },
      { id: 8, title: "Free time", start: "17:00", end: "18:30", category: "Free", note: "", repeat: [], color: undefined },
      { id: 9, title: "Homework", start: "19:00", end: "20:30", category: "Study", note: "", repeat: [], color: undefined },
      { id: 10, title: "Wind down", start: "21:00", end: "22:00", category: "Free", note: "", repeat: [], color: undefined },
    ] },
  { id: "9to5", name: "9-to-5", icon: "💼", desc: "work, meetings, and focus time",
    events: [
      { id: 1, title: "Morning routine", start: "06:30", end: "07:30", category: "Life", note: "", repeat: [], color: undefined },
      { id: 2, title: "Commute", start: "08:00", end: "08:30", category: "Commute", note: "", repeat: [], color: undefined },
      { id: 3, title: "Deep work", start: "09:00", end: "11:00", category: "Study", note: "", repeat: [], color: undefined },
      { id: 4, title: "Team standup", start: "11:00", end: "11:30", category: "Life", note: "", repeat: [], color: undefined },
      { id: 5, title: "Lunch", start: "12:00", end: "13:00", category: "Free", note: "", repeat: [], color: undefined },
      { id: 6, title: "Meetings", start: "13:30", end: "15:00", category: "Life", note: "", repeat: [], color: undefined },
      { id: 7, title: "Focus time", start: "15:00", end: "17:00", category: "Study", note: "", repeat: [], color: undefined },
      { id: 8, title: "Gym", start: "17:30", end: "18:30", category: "Health", note: "", repeat: [], color: undefined },
      { id: 9, title: "Dinner", start: "19:00", end: "19:45", category: "Free", note: "", repeat: [], color: undefined },
      { id: 10, title: "Relax", start: "20:00", end: "22:00", category: "Free", note: "", repeat: [], color: undefined },
    ] },
  { id: "gym", name: "gym-focused", icon: "🏋️", desc: "training blocks, meals, and recovery",
    events: [
      { id: 1, title: "Wake + hydrate", start: "06:00", end: "06:30", category: "Health", note: "", repeat: [], color: undefined },
      { id: 2, title: "Morning workout", start: "06:30", end: "08:00", category: "Health", note: "", repeat: [], color: undefined },
      { id: 3, title: "Breakfast + prep", start: "08:15", end: "09:00", category: "Life", note: "", repeat: [], color: undefined },
      { id: 4, title: "Class / Work", start: "09:30", end: "12:30", category: "Class", note: "", repeat: [], color: undefined },
      { id: 5, title: "Lunch + rest", start: "12:30", end: "13:30", category: "Free", note: "", repeat: [], color: undefined },
      { id: 6, title: "Study / Tasks", start: "14:00", end: "16:00", category: "Study", note: "", repeat: [], color: undefined },
      { id: 7, title: "Afternoon session", start: "16:30", end: "18:00", category: "Health", note: "", repeat: [], color: undefined },
      { id: 8, title: "Dinner", start: "18:30", end: "19:15", category: "Life", note: "", repeat: [], color: undefined },
      { id: 9, title: "Stretch + recovery", start: "19:30", end: "20:00", category: "Health", note: "", repeat: [], color: undefined },
      { id: 10, title: "Wind down", start: "20:30", end: "22:00", category: "Free", note: "", repeat: [], color: undefined },
    ] },
  { id: "blank", name: "start blank", icon: "✨", desc: "build your schedule from scratch",
    events: [] },
];

function OnboardingView({ onChoose }: { onChoose: (events: Event[]) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-5 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="w-full max-w-lg rounded-2xl border-2 border-[var(--sketch-border)] bg-[var(--sketch-bg)] p-8 text-center">

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
          className="mx-auto mb-4 text-5xl">🫙</motion.div>
        <h2 className="sketch-title text-3xl mb-2">welcome to thyme</h2>
        <p className="font-hand text-sm text-[var(--sketch-muted)] mb-8 max-w-xs mx-auto leading-relaxed">
          pick a starter template to get going, or start with a blank canvas
        </p>

        <div className="grid grid-cols-2 gap-3">
          {starterPacks.map((pack, i) => (
            <motion.button key={pack.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.96 }}
              onClick={() => onChoose(pack.events.map(e => ({ ...e })))}
              className="group rounded-xl border-2 border-[var(--sketch-border)] bg-[var(--sketch-card)] p-4 text-left transition-colors hover:border-[var(--sketch-fg)] hover:bg-[var(--sketch-card)]">
              <div className="text-2xl mb-2">{pack.icon}</div>
              <div className="font-hand text-base text-[var(--sketch-fg)] mb-1">{pack.name}</div>
              <div className="font-hand text-xs text-[var(--sketch-muted)] leading-snug">{pack.desc}</div>
              <div className="mt-2 font-hand text-[10px] text-[var(--sketch-muted)]">
                {pack.events.length === 0 ? "empty" : pack.events.length + " blocks"}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Stats / Heatmap View ──────────────────────────────────── */
const STATS_GRAPHS = ["busiest days", "hourly activity", "daily hours", "category ring"] as const;
type StatsGraph = (typeof STATS_GRAPHS)[number];

function StatsView({ onClose, palette, currentDate }: { onClose: () => void; palette: Palette; currentDate: Date }) {
  const [graph, setGraph] = useState<StatsGraph>("busiest days");
  const graphIdx = STATS_GRAPHS.indexOf(graph);
  const prevGraph = () => setGraph(STATS_GRAPHS[(graphIdx - 1 + STATS_GRAPHS.length) % STATS_GRAPHS.length]);
  const nextGraph = () => setGraph(STATS_GRAPHS[(graphIdx + 1) % STATS_GRAPHS.length]);

  /* Compute the week's start (Sunday) and end (next Sunday) as YYYY-MM-DD keys */
  const weekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);
  const weekStartKey = weekStart.toISOString().slice(0, 10);
  const weekEndKey = weekEnd.toISOString().slice(0, 10);

  /* Cloud: all events for the entire week in one query (single source of truth) */
  const cloudWeek = useQuery(api.planner.listEventsForWeek, { startDay: weekStartKey, endDay: weekEndKey });

  /* Build weekEvents from cloud when available, else fall back to localStorage */
  const weekEvents: Event[] = cloudWeek !== undefined
    ? cloudWeek.map(e => ({ id: e.eventId, title: e.title, start: e.start, end: e.end, category: e.category, note: e.note, repeat: e.repeat, color: e.color }))
    : (() => { const arr: Event[] = []; for (let i = 0; i < 7; i++) { const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i); arr.push(...loadEvents(d)); } return arr; })();

  /* Daily data (Mon-Sun) */
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + i);
    const dayKey = d.toISOString().slice(0, 10);
    const dayEvents = cloudWeek !== undefined
      ? cloudWeek.filter(e => e.day === dayKey).map(e => ({ id: e.eventId, title: e.title, start: e.start, end: e.end, category: e.category, note: e.note, repeat: e.repeat, color: e.color }))
      : loadEvents(d);
    return {
      day: dayNames[i], date: d.getDate(),
      events: dayEvents.length,
      hours: dayEvents.reduce((sum, e) => sum + dur(e), 0) / 60,
    };
  });
  const maxDaily = Math.max(...daily.map(d => d.events), 1);
  const maxHours = Math.max(...daily.map(d => d.hours), 1);

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
  const totalHoursRemain = totalMin % 60;
  const avgPerDay = (totalBlocks / 7).toFixed(1);

  /* Productivity score: % of waking hours (7am-11pm) that have blocks */
  const wakingMins = 16 * 60;
  const productivityPct = Math.round((totalMin / (wakingMins * 7)) * 100);

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
            { label: "total hours", value: `${totalHours}h ${totalHoursRemain}m` },
            { label: "avg / day", value: avgPerDay },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-xl border border-[var(--sketch-border)] p-3 text-center">
              <p className="sketch-title text-2xl">{s.value}</p>
              <p className="sketch-label text-[11px] mt-1 opacity-70">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Productivity bar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <p className="sketch-label text-sm font-medium">productivity</p>
            <span className="sketch-title text-lg">{productivityPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--sketch-border)] overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(productivityPct, 100)}%` }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
              className="h-full rounded-full bg-[#e55b5b]" />
          </div>
          <p className="sketch-label text-[10px] mt-1 opacity-50">{totalMin} min scheduled out of {wakingMins * 7} waking min / week</p>
        </motion.div>

        {/* Graph navigation */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-4">
          <motion.button whileHover={{ scale: 1.1, x: -2 }} whileTap={{ scale: 0.9 }}
            onClick={prevGraph} className="sketch-btn-icon size-8"><ChevronLeft className="size-4" /></motion.button>
          <motion.p key={graph} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="sketch-label text-sm font-medium tracking-wide uppercase">{graph}</motion.p>
          <motion.button whileHover={{ scale: 1.1, x: 2 }} whileTap={{ scale: 0.9 }}
            onClick={nextGraph} className="sketch-btn-icon size-8"><ChevronRight className="size-4" /></motion.button>
        </motion.div>

        {/* ── Graph: Busiest Days ── */}


        {graph === "busiest days" && (
          <motion.div key="busiest" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }} className="mb-6">
            <div className="flex items-end gap-2 h-32">
              {daily.map((d, i) => {
                const h = maxDaily > 0 ? (d.events / maxDaily) * 100 : 0;
                const isToday = d.date === currentDate.getDate();
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="sketch-label text-[10px] font-medium opacity-70">{d.events}</span>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }}
                      transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 200, damping: 18 }}
                      className={`w-full rounded-t-md min-h-[3px] ${isToday ? "bg-[#e55b5b]" : "bg-[var(--sketch-fg)] opacity-30"}`} />
                    <span className="sketch-label text-[10px] font-medium">{d.day}</span>
                    <span className="sketch-label text-[9px] opacity-50">{d.date}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Graph: Hourly Activity ── */}
        {graph === "hourly activity" && (
          <motion.div key="hourly" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }} className="mb-6">
            <div className="grid grid-cols-12 gap-1.5">
              {hourly.map((count, h) => {
                const intensity = maxHourly > 0 ? count / maxHourly : 0;
                const bg = intensity === 0 ? "var(--sketch-border)" : `rgba(229, 91, 91, ${0.15 + intensity * 0.85})`;
                return (
                  <div key={h} className="relative group">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: 0.05 + h * 0.02, type: "spring", stiffness: 300, damping: 15 }}
                      className="aspect-square rounded-lg cursor-default"
                      style={{ backgroundColor: bg }} />
                    <span className="sketch-label text-[9px] absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium">
                      {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
                      {count > 0 && <span className="block text-[8px] opacity-70">{count} block{count > 1 ? "s" : ""}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-6">
              {['12am', '6am', '12pm', '6pm', '12am'].map(t => (
                <span key={t} className="sketch-label text-[10px] font-medium opacity-60">{t}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Graph: Daily Hours ── */}
        {graph === "daily hours" && (
          <motion.div key="dailyhours" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }} className="mb-6">
            <div className="flex items-end gap-2 h-32">
              {daily.map((d, i) => {
                const pct = maxHours > 0 ? (d.hours / maxHours) * 100 : 0;
                const isToday = d.date === currentDate.getDate();
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="sketch-label text-[10px] font-medium opacity-70">{d.hours.toFixed(1)}h</span>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                      transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 200, damping: 18 }}
                      className="w-full rounded-t-md min-h-[3px]" style={{ backgroundColor: isToday ? '#e55b5b' : 'var(--sketch-fg)', opacity: isToday ? 1 : 0.3 }} />
                    <span className="sketch-label text-[10px] font-medium">{d.day}</span>
                    <span className="sketch-label text-[9px] opacity-50">{d.date}</span>
                  </div>
                );
              })}
            </div>
            <p className="sketch-label text-[10px] text-center mt-3 opacity-50">total hours scheduled per day</p>
          </motion.div>
        )}

        {/* ── Graph: Category Ring ── */}
        {graph === "category ring" && (
          <motion.div key="ring" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }} className="mb-6 flex flex-col items-center">
            <svg viewBox="0 0 200 200" className="w-44 h-44">
              {(() => {
                let cumAngle = -Math.PI / 2;
                return catList.map(([cat, mins], i) => {
                  const sliceAngle = (mins / totalMin) * Math.PI * 2;
                  const r = 80, cx = 100, cy = 100;
                  const x1 = cx + r * Math.cos(cumAngle);
                  const y1 = cy + r * Math.sin(cumAngle);
                  cumAngle += sliceAngle;
                  const x2 = cx + r * Math.cos(cumAngle);
                  const y2 = cy + r * Math.sin(cumAngle);
                  const large = sliceAngle > Math.PI ? 1 : 0;
                  const color = palette[cat] || fallbackColor;
                  return (
                    <motion.path key={cat}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                      fill={color} style={{ transformOrigin: `${cx}px ${cy}px` }} />
                  );
                });
              })()}
              <circle cx={100} cy={100} r={38} fill="var(--sketch-card)" shapeRendering="geometricPrecision" />
              <text x={100} y={96} textAnchor="middle" className="sketch-title" fontSize="22" fill="var(--sketch-fg)">{Math.round(totalMin / 60)}h</text>
              <text x={100} y={114} textAnchor="middle" className="sketch-label" fontSize="10" fill="var(--sketch-muted)" opacity="0.7">total</text>
            </svg>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
              {catList.map(([cat, mins]) => {
                const pct = Math.round((mins / totalMin) * 100);
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="sketch-dot" style={{ backgroundColor: palette[cat] || fallbackColor }} />
                    <span className="sketch-label text-[11px] font-medium capitalize">{cat}</span>
                    <span className="sketch-label text-[10px] opacity-60 ml-auto">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Category bars (always shown) ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="sketch-label text-sm font-medium tracking-wide mb-3">time by category</p>
          <div className="space-y-2.5">
            {catList.map(([cat, mins], i) => {
              const pct = (mins / totalMin) * 100;
              const color = palette[cat] || fallbackColor;
              return (
                <motion.div key={cat} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }} className="flex items-center gap-3">
                  <span className="sketch-dot" style={{ backgroundColor: color }} />
                  <span className="sketch-label text-[12px] font-medium w-24 flex-shrink-0 capitalize">{cat}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[var(--sketch-border)] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.4 + i * 0.05, type: "spring", stiffness: 100, damping: 18 }}
                      className="h-full rounded-full" style={{ backgroundColor: color }} />
                  </div>
                  <span className="sketch-label text-[11px] w-14 text-right font-medium">{Math.floor(mins / 60)}h {mins % 60}m</span>
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
