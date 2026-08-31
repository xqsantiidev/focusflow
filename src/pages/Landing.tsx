import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ── Intro geometry (module-level so animation targets stay stable) ── */
const SEGMENTS: { d: string; fill: string; cx: number; cy: number; dx: number; dy: number; rot: number }[] = [
  { d: "M 200 130 L 200 50 A 150 150 0 0 1 285 75 L 215 140 A 70 70 0 0 0 200 130 Z", fill: "#4caf50", cx: 228, cy: 94, dx: 0.4, dy: -1, rot: -16 },
  { d: "M 215 140 L 285 75 A 150 150 0 0 1 340 165 L 240 195 A 70 70 0 0 0 215 140 Z", fill: "#ffc107", cx: 290, cy: 137, dx: 1, dy: -0.45, rot: 13 },
  { d: "M 240 195 L 340 165 A 150 150 0 0 1 330 270 L 235 230 A 70 70 0 0 0 240 195 Z", fill: "#9c27b0", cx: 308, cy: 219, dx: 1, dy: 0.25, rot: -11 },
  { d: "M 235 230 L 330 270 A 150 150 0 0 1 270 340 L 210 255 A 70 70 0 0 0 235 230 Z", fill: "#e91e63", cx: 268, cy: 287, dx: 0.55, dy: 1, rot: 15 },
  { d: "M 210 255 L 270 340 A 150 150 0 0 1 150 340 L 170 245 A 70 70 0 0 0 210 255 Z", fill: "#ffc107", cx: 187, cy: 309, dx: 0.15, dy: 1, rot: -13 },
  { d: "M 170 245 L 150 340 A 150 150 0 0 1 65 250 L 155 195 A 70 70 0 0 0 170 245 Z", fill: "#2196f3", cx: 113, cy: 268, dx: -0.75, dy: 0.75, rot: 12 },
  { d: "M 155 195 L 65 250 A 150 150 0 0 1 65 130 L 160 170 A 70 70 0 0 0 155 195 Z", fill: "#e91e63", cx: 91, cy: 214, dx: -1, dy: 0.05, rot: -14 },
  { d: "M 160 170 L 65 130 A 150 150 0 0 1 200 50 L 200 130 A 70 70 0 0 0 160 170 Z", fill: "#ffc107", cx: 132, cy: 187, dx: -0.7, dy: -0.75, rot: 10 },
];

const SEG_ASSEMBLED = { scale: 1, opacity: 1, x: 0, y: 0, rotate: 0 };
const SEG_OUT = SEGMENTS.map(s => ({
  scale: 0, opacity: 0,
  x: s.dx * 95, y: s.dy * 95,
  rotate: s.rot,
}));

export default function Landing() {
  const navigate = useNavigate();
  const showcaseRef = useRef<HTMLDivElement>(null);

  /* ── Intro sequence: wheel loads → click-driven shatter story ── */
  type Phase = "drawing" | "ready" | "c1" | "c2" | "c3";
  const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [phase, setPhase] = useState<Phase>(prefersReduced ? "c3" : "drawing");
  const [healed, setHealed] = useState(prefersReduced); // wheel snaps back together
  const introDone = phase === "c3";

  useEffect(() => {
    if (phase === "drawing") {
      const t = setTimeout(() => setPhase("ready"), 1700);
      return () => clearTimeout(t);
    }
  }, [phase]);

  /* Click-driven advance: ready → c1 (shatter) → c2 (reassemble) → c3 (sketchbook = the arrow) */
  const advance = () => {
    if (phase === "ready") setPhase("c1");
    else if (phase === "c1") { setHealed(true); setPhase("c2"); }
    else if (phase === "c2") setPhase("c3");
  };

  /* Heal the wheel + glide down to the details */
  const goToDetails = () => {
    setHealed(true);
    showcaseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* Healing also triggers if the user scrolls on their own */
  useEffect(() => {
    if (!introDone || healed) return;
    const heal = () => setHealed(true);
    window.addEventListener("wheel", heal, { once: true, passive: true });
    window.addEventListener("touchmove", heal, { once: true, passive: true });
    return () => {
      window.removeEventListener("wheel", heal);
      window.removeEventListener("touchmove", heal);
    };
  }, [introDone, healed]);

  /* Lock page scroll until the whole story is told */
  useEffect(() => {
    if (introDone) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [introDone]);

  const shattered = (phase === "c1" || phase === "c2" || phase === "c3") && !healed;
  const caption =
    phase === "ready" ? "tap the wheel" :
    phase === "c1" ? "this is your whole day" :
    phase === "c2" ? "tap to add" :
    phase === "c3" ? "your sketchbook" : null;
  return (
    <main className="sketchbook min-h-screen overflow-hidden">
      <div className="mx-auto max-w-[620px] px-6 pb-24 pt-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <span className="sketch-title text-2xl">thyme<span className="text-[#e55b5b]">.</span></span>
          <button onClick={() => navigate("/auth")} className="sketch-link text-sm">
            open thyme →
          </button>
        </header>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
          <h1 className="hero-display text-6xl sm:text-7xl mt-20 leading-[1.05]">
            your day,<br />
            <span className="text-[#8a8678]">drawn out.</span>
          </h1>
          <p className="hero-copy text-lg mt-6 max-w-sm opacity-80">
            thyme is a daily planner that turns your schedule into a hand-drawn circle — colorful, creative, and yours.
          </p>
          <button onClick={() => navigate("/auth")} className="sketch-btn-primary mt-8">
            plan my day
          </button>
        </motion.div>

        {/* Sketch circle preview — loads, then a click-driven shatter story */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          className="mt-14 select-none">
          <div onClick={phase === "ready" || phase === "c1" || phase === "c2" ? advance : undefined}
            className={phase === "ready" || phase === "c1" || phase === "c2" ? "cursor-pointer" : "cursor-default"}>
          <svg viewBox="0 0 400 400" className="w-full max-w-[380px] mx-auto overflow-visible">
            {/* Outer dotted guide — spins while the wheel "loads" */}
            <motion.circle cx="200" cy="200" r="175" fill="none" stroke="#b8b4a8" strokeWidth="1.5" strokeDasharray="3 8"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={{ rotate: 0 }}
              animate={phase === "drawing" ? { rotate: 160 } : { rotate: 0 }}
              transition={phase === "drawing" ? { duration: 1.5, ease: "easeOut" } : { duration: 0.6 }}
              opacity="0.5" />
            {/* Segments — pop in one by one, burst outward, then boomerang back */}
            {SEGMENTS.map((s, i) => (
              <motion.path key={i} d={s.d} fill={s.fill} stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  phase === "drawing" || phase === "ready" || healed ? SEG_ASSEMBLED : SEG_OUT[i]!
                }
                transition={
                  phase === "drawing"
                    ? { delay: 0.75 + i * 0.07, type: "spring", stiffness: 280, damping: 16 }
                    : healed
                      ? { delay: 0.06 + i * 0.04, type: "spring", stiffness: 320, damping: 12 }
                      : { delay: i * 0.03, type: "spring", stiffness: 340, damping: 14 }
                } />
            ))}
            {/* Inner circle — draws itself clockwise from the top */}
            <motion.circle cx="200" cy="200" r="70" fill="#faf8f0" stroke="#1a1a18" strokeWidth="2.5"
              style={{ transformBox: "fill-box", transformOrigin: "center", rotate: -90 }}
              initial={{ pathLength: 0, fillOpacity: 0 }}
              animate={{ pathLength: 1, fillOpacity: 1 }}
              transition={{ pathLength: { duration: 0.55, delay: 0.4, ease: "easeInOut" }, fillOpacity: { duration: 0.4, delay: 0.8 } }} />
            <motion.text x="200" y="195" textAnchor="middle" className="sketch-title" fontSize="28" fill="#3a3830"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: shattered ? 1.06 : 1 }}
              transition={{ delay: 0.95, type: "spring", stiffness: 300, damping: 15 }}>5/28</motion.text>
            <motion.text x="200" y="218" textAnchor="middle" className="sketch-title" fontSize="14" fill="#8a8678"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.3 }}>Thursday</motion.text>
          </svg>

          {/* Caption — one big readable line per beat, advanced by clicking */}
          <div className="mt-3 flex min-h-[96px] flex-col items-center justify-start gap-1">
            <AnimatePresence mode="wait">
              {caption && (
                <motion.div key={caption}
                  initial={{ opacity: 0, y: 20, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -14, scale: 0.94, transition: { duration: 0.28 } }}
                  transition={{ type: "spring", stiffness: 330, damping: 16 }}
                  className="text-center">
                  {phase === "c3" ? (
                    /* The final caption IS the arrow — click it to glide down */
                    <motion.button onClick={e => { e.stopPropagation(); goToDetails(); }}
                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                      transition={{ type: "spring", stiffness: 420, damping: 13 }}
                      className="sketch-hand text-2xl inline-flex items-center gap-2.5"
                      aria-label="scroll to the details">
                      {caption}
                      <motion.span animate={{ y: [0, 5, 0] }}
                        transition={{ y: { repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatDelay: 0.35 } }}
                        className="inline-block text-[var(--sketch-muted)]">
                        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12.1 3.6 C11.7 8.2 11.9 13.6 12.2 19.4" />
                          <path d="M6.4 14.2 C8 16.4 10 18.4 12.3 20.2 C14.2 18.4 16.4 16.3 18.2 13.8" />
                        </svg>
                      </motion.span>
                    </motion.button>
                  ) : (
                    <motion.p animate={phase === "ready" ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                      transition={phase === "ready" ? { repeat: Infinity, duration: 1.4 } : {}}
                      className="sketch-hand text-2xl">{caption}</motion.p>
                  )}
                  <svg viewBox="0 0 120 8" className="mx-auto mt-1 w-28" fill="none">
                    <motion.path d="M2 5.5 C38 3.5 82 6.5 118 4" stroke="var(--sketch-fg)" strokeWidth="2.2" strokeLinecap="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ delay: 0.3, duration: 0.45, ease: "easeOut" }} />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            {(phase === "ready" || phase === "c1" || phase === "c2") && (
              <motion.p animate={{ opacity: [0.4, 0.85, 0.4] }} transition={{ repeat: Infinity, duration: 1.7 }}
                className="sketch-label text-[10px] mt-1">click to continue →</motion.p>
            )}
          </div>
          </div>

          {/* Skip affordance during the story */}
          <AnimatePresence>
            {!introDone && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }}
                onClick={e => { e.stopPropagation(); setHealed(true); setPhase("c3"); }}
                className="sketch-link mx-auto mt-2 block text-[11px]">
                skip →
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Everything below the hero — revealed once the story is told */}
        <div aria-hidden={!introDone}
          className={`transition-opacity duration-500 ${introDone ? "opacity-100" : "pointer-events-none select-none opacity-0"}`}>
        {/* Features */}
        <div className="mt-16 space-y-4">
          {([
            {
              title: "see your whole day",
              desc: "one colorful circle, every block in place.",
              icon: (
                <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {/* hand-drawn day wheel */}
                  <path d="M16.4 3.9 C22.6 3.6 28.4 8.4 28.6 15.2 C28.8 22 23.2 28.2 16.2 28.5 C9.2 28.8 3.4 23.4 3.2 16.4 C3 9.6 9.8 4.2 16.4 3.9 Z" strokeDasharray="2.6 3.2" opacity="0.55" />
                  {/* colored-ish arc segments (wobbly) */}
                  <path d="M16.3 7.6 C19.8 7.3 23.4 9.4 24.8 12.6 C25.6 14.7 25.4 16.6 24.6 18.2 C22.6 15.4 19.4 13 16.1 12.2 Z" fill="currentColor" opacity="0.22" strokeWidth="1" />
                  <path d="M13.8 25.1 C10.8 23.8 8.3 21.3 7.4 18.2 C7.2 16.8 7.3 15.4 7.8 14.2 C9.8 17.4 12.6 19.9 16 21.4 Z" fill="currentColor" opacity="0.14" strokeWidth="1" />
                </svg>
              ),
            },
            {
              title: "tap to add",
              desc: "open space on the ring? just tap it.",
              icon: (
                <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {/* tap ripples */}
                  <path d="M4.9 15.8 C4.7 12.2 7.2 8.6 10.8 7.2" strokeDasharray="2.4 2.6" opacity="0.4" />
                  <path d="M27.2 15.4 C27.6 11.8 25.2 8.2 21.6 6.7" strokeDasharray="2.4 2.6" opacity="0.4" />
                  {/* wobbly plus */}
                  <path d="M16.5 10.4 C15.7 13.6 15.8 17.6 16.2 21.2" />
                  <path d="M10.4 16 C14 15.4 18.6 15.6 22 16.3" />
                </svg>
              ),
            },
            {
              title: "your sketchbook",
              desc: "colors, patterns, and a planner that feels like yours.",
              icon: (
                <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {/* hand-drawn open book */}
                  <path d="M16.2 8.4 C13 6.4 9.2 5.6 5.2 6.1 C4.6 11.6 4.7 17.6 5.4 23.6 C9.4 23.2 13.2 24 16.3 26 C19.5 24 23.4 23.1 27.5 23.6 C28.2 17.5 28.3 11.5 27.7 6.2 C23.5 5.7 19.4 6.4 16.2 8.4 Z" />
                  <path d="M16.1 8.6 C16 14 16.1 20 16.2 25.8" />
                  {/* scribble lines on left page */}
                  <path d="M8 11.6 C10.4 11.2 12.6 11.4 14 12" strokeWidth="1.1" opacity="0.5" />
                  <path d="M8 15 C10.6 14.6 12.8 14.8 14.2 15.3" strokeWidth="1.1" opacity="0.5" />
                  {/* wobbly sun on right page */}
                  <path d="M21.6 12.2 C22.8 12 24 12.6 24.4 13.8 C24.8 15 24 16.4 22.8 16.6 C21.6 16.8 20.4 16.2 20 15 C19.6 13.8 20.4 12.5 21.6 12.2 Z" strokeWidth="1.1" opacity="0.5" />
                </svg>
              ),
            },
          ] as const).map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -26 : 26, rotate: i % 2 === 0 ? -2 : 2 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.3, type: "spring", stiffness: 360, damping: 15 }}
              whileHover={{ y: -3, x: i % 2 === 0 ? 2 : -2, transition: { type: "spring", stiffness: 480, damping: 13 } }}
              className="sketch-card group cursor-default">
              <motion.div whileHover={{ rotate: -8, scale: 1.14 }} transition={{ type: "spring", stiffness: 420, damping: 10 }}
                className="text-[var(--sketch-muted)] opacity-40 group-hover:opacity-75 transition-opacity w-fit">
                {f.icon}
              </motion.div>
              <h3 className="sketch-hand text-lg mt-2.5">{f.title}</h3>
              <p className="sketch-body text-[12px] mt-0.5 opacity-50 leading-snug">{f.desc}</p>
              {i === 2 && (
                <motion.button
                  onClick={() => showcaseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  whileHover={{ y: 4 }}
                  whileTap={{ y: 10, scale: 0.92 }}
                  animate={{ y: [0, 4, 0] }}
                  transition={{ y: { repeat: Infinity, duration: 1.6, ease: "easeInOut", repeatDelay: 0.4 } }}
                  className="mx-auto mt-4 block text-[var(--sketch-muted)] opacity-45 hover:opacity-90 transition-opacity"
                  aria-label="scroll to features">
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {/* hand-drawn down arrow */}
                    <path d="M12.1 3.6 C11.7 8.2 11.9 13.6 12.2 19.4" />
                    <path d="M6.4 14.2 C8 16.4 10 18.4 12.3 20.2 C14.2 18.4 16.4 16.3 18.2 13.8" />
                  </svg>
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Feature Showcase */}
        <motion.div ref={showcaseRef} initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="mt-20 scroll-mt-10">
          <motion.h2 initial={{ y: 14 }} whileInView={{ y: 0 }} viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="hero-display text-3xl sm:text-4xl text-center">everything you need.</motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 0.5 }} viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="sketch-body text-sm text-center mt-2 max-w-xs mx-auto">more features, less friction. plan faster, see clearer.</motion.p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              {
                title: "templates",
                desc: "save any day as a template and reuse it with one tap.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* hand-drawn tilted sheet */}
                    <path d="M6.4 5.6 C11 4.6 19.6 4.8 25.4 5.7 C26.2 12.8 26 21 25.1 26.5 C18.2 27.2 10.4 27 6 26.2 C5.2 19.4 5.5 11.8 6.4 5.6 Z" />
                    {/* wobbly divider */}
                    <path d="M5.8 11.6 C12 10.6 19.8 10.9 25.9 12" />
                    <path d="M12.6 5.4 C12 11 12.2 20 11.8 26.4" />
                    {/* scribbled star */}
                    <path d="M18.8 15.8 l2.6 2.4 -1.6 3 -3.4-.8 -.5-3.2 z" fill="currentColor" opacity="0.3" strokeWidth="1" />
                  </svg>
                ),
              },
              {
                title: "repeating",
                desc: "set blocks to repeat on specific days — schedule once, every week.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* wobbly loop arrows */}
                    <path d="M21.6 3.4 C24 4.8 25.9 6.9 26.7 9 C25 10.7 22.9 12.3 21.3 13.3 C21.7 11 21.9 7.8 21.2 4.6" />
                    <path d="M26.6 9.2 C19 8.5 8.4 8.9 4.5 10.7 C4 12.5 4.2 13.8 4.7 14.8 C9.4 13.5 19 13.2 26.7 9.4" />
                    <path d="M10.4 28.6 C8.1 27.2 6.2 25.3 5.4 23.2 C7 21.4 9.1 19.7 10.7 18.7 C10.2 21 10 24.1 10.7 27.4" />
                    <path d="M5.5 23.2 C13 23.8 23.6 23.3 27.5 21.4 C28 19.6 27.8 18.3 27.3 17.3 C22.5 18.6 12.9 18.9 5.3 22.9" />
                  </svg>
                ),
              },
              {
                title: "palette",
                desc: "pick your own colors for every category — make the wheel yours.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* hand-drawn blobby palette */}
                    <path d="M15.4 3.9 C9.2 3.5 3.7 8.7 3.3 15.5 C2.9 22.3 8.9 28.2 15.5 28.6 C17.1 28.7 18.7 27.7 18.8 25.9 C18.9 24.8 18.4 23.8 17.6 23.2 C16.8 22.6 16.4 21.8 16.4 20.9 C16.5 19 18.1 17.6 19.9 17.6 L23.5 17.9 C26.7 18.1 29.5 15.4 29.3 12.2 C28.9 7 22.5 4.3 15.4 3.9 Z" />
                    <circle cx="10.6" cy="13.7" r="2.2" fill="currentColor" opacity="0.55" />
                    <circle cx="15.9" cy="8.9" r="2.4" fill="currentColor" opacity="0.75" />
                    <circle cx="22.5" cy="11.7" r="2" fill="currentColor" opacity="0.4" />
                    <circle cx="9.6" cy="20.5" r="1.8" fill="currentColor" opacity="0.3" />
                  </svg>
                ),
              },
              {
                title: "stats",
                desc: "busiest days, hourly activity, category ring — see where your time goes.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* wonky bars */}
                    <path d="M5 27.2 C6.2 22 5.8 19 6.4 16.4 C7.6 16.6 9.4 16.5 10.4 16.8 C10.2 20.6 10.5 24.4 10 27.4 Z" fill="currentColor" opacity="0.18" />
                    <path d="M13.6 27.6 C14.4 21 13.8 16.4 14.6 11.2 C15.8 11.4 17.4 11.2 18.6 11.6 C18.4 17 18.8 22.6 18.2 27.8 Z" fill="currentColor" opacity="0.3" />
                    <path d="M22.4 27.4 C23 18 22.6 12 23 5.6 C24.2 5.8 25.8 5.6 26.8 6 C26.6 13 26.8 21 26.2 27.6 Z" fill="currentColor" opacity="0.45" />
                    {/* sketchy baseline */}
                    <path d="M3.6 28.3 C12 29.1 22 28.6 28.6 27.9" strokeDasharray="2.4 2.6" opacity="0.35" />
                  </svg>
                ),
              },
              {
                title: "quick-add",
                desc: "type \"gym 6–7pm\" and hit enter — no forms, no friction.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* dashed sketchy circle */}
                    <path d="M16.3 4.5 C21.2 4.1 26.9 8.2 28.1 13.7 C29.5 20.5 24.4 27.3 17.4 28.1 C10.6 28.9 4.3 24.5 3.8 17.9 C3.3 11 9.5 4.9 16.3 4.5 Z" strokeDasharray="3.2 3" />
                    {/* wobbly plus */}
                    <path d="M16.5 9.4 C15.6 13.4 15.8 18.6 16.2 22.6" />
                    <path d="M9.7 15.9 C14 15.2 19.1 15.5 22.8 16.3" />
                  </svg>
                ),
              },
              {
                title: "dark mode",
                desc: "one tap to switch — late nights, early mornings, your call.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* hand-drawn crescent */}
                    <path d="M26.3 19.3 C26.7 12.8 21.4 6.7 14.7 6.3 C12.7 9 11.9 12.1 12.1 15.1 C12.7 21.2 17.8 25.6 23.9 26" />
                    <path d="M25.7 18.6 C25.3 12.4 20.3 7.4 14.1 7 C13 9.4 12.4 12 12.6 14.8 C13.2 20.6 18 25 23.6 25.6" fill="currentColor" opacity="0.14" strokeWidth="1" />
                    {/* wobbly stars */}
                    <path d="M22.4 8 l.5 1.5 1.3.6 -1.3.7 -.5 1.5 -.9-1.3 -1.5-.2 1.1-1.3 z" fill="currentColor" opacity="0.55" strokeWidth="0.9" />
                    <path d="M27.2 14.2 l.4 1.1 1.1.5 -1.1.6 -.4 1.1 -.7-1 -1.1-.2 .9-1 z" fill="currentColor" opacity="0.35" strokeWidth="0.9" />
                  </svg>
                ),
              },
            ] as const).map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, x: i % 3 === 0 ? -28 : i % 3 === 1 ? 0 : 28, y: i % 3 === 1 ? 22 : 0, scale: 0.88, rotate: i % 3 === 0 ? -2.5 : i % 3 === 2 ? 2.5 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.04, duration: 0.28, type: "spring", stiffness: 380, damping: 14 }}
                whileHover={{ y: -6, scale: 1.05, rotate: i % 2 === 0 ? -0.6 : 0.6, transition: { duration: 0.1, type: "spring", stiffness: 520, damping: 12 } }}
                className="sketch-card group cursor-default">
                <motion.div whileHover={{ rotate: -9, scale: 1.15 }} transition={{ type: "spring", stiffness: 420, damping: 10 }}
                  className="text-[var(--sketch-muted)] opacity-40 group-hover:opacity-75 transition-opacity w-fit">
                  {f.icon}
                </motion.div>
                <h3 className="sketch-hand text-lg mt-2.5">{f.title}</h3>
                <p className="sketch-body text-[11px] mt-0.5 opacity-45 leading-snug">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="hero-display text-3xl sm:text-4xl text-center">questions?</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg sm:max-w-none mx-auto">
            {([
              {
                q: "is it free?",
                a: "yes. no subscriptions, no hidden fees, no ads. just your planner.",
                color: "#4caf50",
              },
              {
                q: "is my data private?",
                a: "your schedule lives in your account, visible only to you. we don't sell data.",
                color: "#2196f3",
              },
              {
                q: "does it work on mobile?",
                a: "yes. designed mobile-first, works in any browser. no app download needed.",
                color: "#ffc107",
              },
            ] as const).map((item, i) => (
              <motion.div key={item.q}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.1, duration: 0.4, type: "spring", stiffness: 200, damping: 22 }}
                className="sketch-card">
                <div className="size-6 rounded-full mb-3 flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: item.color }}>
                  ?
                </div>
                <h4 className="sketch-hand text-base">{item.q}</h4>
                <p className="sketch-body text-[11px] mt-2 opacity-50 leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="sketch-label text-sm opacity-40">start with one day.</p>
          <h2 className="hero-display text-4xl mt-2">make it a good one.</h2>
          <button onClick={() => navigate("/auth")} className="sketch-btn-primary mt-6">
            open thyme
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-[var(--sketch-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span className="sketch-title text-sm">thyme<span className="text-[#e55b5b]">.</span></span>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate("/privacy")} className="sketch-body opacity-40 hover:opacity-80 transition-opacity">privacy</button>
            <button onClick={() => navigate("/terms")} className="sketch-body opacity-40 hover:opacity-80 transition-opacity">terms</button>
          </div>
          <span className="sketch-body opacity-30">made with care.</span>
        </footer>
        </div>
      </div>
    </main>
  );
}
