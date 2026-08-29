import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export type Budget = { name: string; color: string; target: number; used: number };

function toRgb(color: string) {
  const value = color.replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(value)
    ? `${parseInt(value.slice(0, 2), 16)}, ${parseInt(value.slice(2, 4), 16)}, ${parseInt(value.slice(4, 6), 16)}`
    : "176, 190, 197";
}

function Potion({ budget, delay = 0 }: { budget: Budget; delay?: number }) {
  const ratio = budget.target > 0 ? budget.used / budget.target : 0;
  const fill = Math.min(100, Math.max(0, ratio * 100));
  const [pulse, setPulse] = useState(false);
  const [prev, setPrev] = useState({ used: budget.used, target: budget.target });
  const color = budget.color || "#b0bec5";
  const rgb = toRgb(color);
  const over = ratio > 1;
  const fillColor = over ? "#e55b5b" : color;

  // Unique clip ID so each flask has its own mask
  const clipId = useMemo(() => `flask-${budget.name.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`, [budget.name]);

  useEffect(() => {
    if (prev.used === budget.used && prev.target === budget.target) return;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 950);
    setPrev({ used: budget.used, target: budget.target });
    return () => window.clearTimeout(t);
  }, [budget.used, budget.target, prev.used, prev.target]);

  // Flask SVG shape points (narrow neck, wide round belly)
  const W = 48, H = 72;
  // Neck
  const neckTop = 2, neckBot = 18, neckW = 8;
  // Belly
  const bellyTop = 16, bellyBot = H - 4, bellyW = 19;
  const flaskPath = `M ${W / 2 - neckW} ${neckTop}
    L ${W / 2 + neckW} ${neckTop}
    L ${W / 2 + neckW} ${neckBot}
    Q ${W / 2 + neckW} ${bellyTop + 2}, ${W / 2 + bellyW} ${bellyTop + 8}
    Q ${W / 2 + bellyW + 2} ${bellyBot - 6}, ${W / 2} ${bellyBot}
    Q ${W / 2 - bellyW - 2} ${bellyBot - 6}, ${W / 2 - bellyW} ${bellyTop + 8}
    Q ${W / 2 - neckW} ${bellyTop + 2}, ${W / 2 - neckW} ${neckBot} Z`;

  // Liquid fill: maps 0-100% to the belly area of the flask
  const bellyH = bellyBot - bellyTop - 4;
  const liquidTop = bellyBot - (fill / 100) * bellyH;
  // Wave amplitude scales with fill
  const waveAmp = 1.5 + (fill > 5 ? 1 : 0);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay, type: "spring", stiffness: 340, damping: 24 }}
      className="min-w-0 flex-1 rounded-2xl border border-[var(--sketch-border)] bg-[var(--sketch-bg)]/60 px-1 py-2 text-center backdrop-blur-[2px]"
    >
      <p className="sketch-label truncate px-0.5 text-[8px] font-semibold capitalize opacity-80">{budget.name}</p>

      <motion.div
        animate={pulse ? { rotate: [-1.5, 1.5, -1, 0.8, 0], y: [0, -1, 0.5, 0] } : {}}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        className="relative mx-auto mt-1"
        style={{ width: W, height: H }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
          <defs>
            {/* Clip the liquid to the flask interior */}
            <clipPath id={clipId}>
              <path d={flaskPath} />
            </clipPath>
            {/* Liquid gradient */}
            <linearGradient id={`${clipId}-grad`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={fillColor} stopOpacity="1" />
              <stop offset="85%" stopColor={fillColor} stopOpacity="0.85" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Flask body outline */}
          <path d={flaskPath} fill="var(--sketch-card)" stroke="var(--sketch-line)" strokeWidth="1.8" strokeLinejoin="round" />

          {/* Cork / stopper */}
          <rect x={W / 2 - 6} y={neckTop - 4} width={12} height={6} rx={2} fill="var(--sketch-card)" stroke="var(--sketch-line)" strokeWidth="1.5" />
          <line x1={W / 2 - 3} y1={neckTop - 3} x2={W / 2 + 3} y2={neckTop - 3} stroke="var(--sketch-line)" strokeWidth="0.7" opacity="0.4" />
          <line x1={W / 2 - 2} y1={neckTop - 1} x2={W / 2 + 2} y2={neckTop - 1} stroke="var(--sketch-line)" strokeWidth="0.5" opacity="0.3" />

          {/* Liquid fill (clipped to flask) */}
          <g clipPath={`url(#${clipId})`}>
            <motion.rect
              x={0}
              width={W}
              fill={`url(#${clipId}-grad)`}
              initial={false}
              animate={{ y: liquidTop, height: bellyBot - liquidTop + 4 }}
              transition={{ type: "spring", stiffness: 70, damping: 13, mass: 0.7 }}
            />

            {/* Surface wave */}
            <motion.path
              initial={false}
              animate={{
                d: pulse
                  ? [
                      `M 0 ${liquidTop} Q ${W * 0.25} ${liquidTop - waveAmp * 2} ${W * 0.5} ${liquidTop} Q ${W * 0.75} ${liquidTop + waveAmp * 2} ${W} ${liquidTop}`,
                      `M 0 ${liquidTop} Q ${W * 0.25} ${liquidTop + waveAmp * 2} ${W * 0.5} ${liquidTop} Q ${W * 0.75} ${liquidTop - waveAmp * 2} ${W} ${liquidTop}`,
                    ]
                  : [
                      `M 0 ${liquidTop} Q ${W * 0.25} ${liquidTop - waveAmp} ${W * 0.5} ${liquidTop} Q ${W * 0.75} ${liquidTop + waveAmp} ${W} ${liquidTop}`,
                      `M 0 ${liquidTop} Q ${W * 0.25} ${liquidTop + waveAmp} ${W * 0.5} ${liquidTop} Q ${W * 0.75} ${liquidTop - waveAmp} ${W} ${liquidTop}`,
                    ],
              }}
              transition={{ duration: pulse ? 0.6 : 2.5, repeat: pulse ? 0 : Infinity, ease: "easeInOut" }}
              stroke="white"
              strokeWidth="1.2"
              strokeOpacity="0.5"
              fill="none"
            />

            {/* Bubbles */}
            <AnimatePresence>
              {pulse && [0, 1, 2, 3].map(i => (
                <motion.circle
                  key={i}
                  cx={W * 0.25 + (i * W * 0.18)}
                  initial={{ cy: bellyBot - 4, r: 0, opacity: 0 }}
                  animate={{ cy: liquidTop + 4, r: 1.2 + (i % 2) * 0.5, opacity: [0, 0.7, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, delay: i * 0.07, ease: "easeOut" }}
                  fill="white"
                  fillOpacity="0.6"
                />
              ))}
            </AnimatePresence>

            {/* Inner highlight */}
            <rect x={W / 2 - bellyW + 3} width={3} height={bellyH * 0.6} rx={1.5} fill="white" opacity="0.15" />
          </g>

          {/* Glow effect when liquid is present */}
          {fill > 0 && (
            <motion.circle
              cx={W / 2}
              cy={bellyBot - bellyH * 0.3}
              r={bellyW * 0.7}
              fill={fillColor}
              opacity={0.06 + (fill / 100) * 0.06}
              animate={{ r: [bellyW * 0.65, bellyW * 0.75, bellyW * 0.65] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </svg>
      </motion.div>

      <p className="sketch-label mt-0.5 text-[8px] opacity-55">
        {over && <span className="text-[#e55b5b]">over · </span>}
        {budget.used.toFixed(1)} / {budget.target.toFixed(1)}h
      </p>

      <div className="mx-1 mt-1.5 h-[5px] overflow-hidden rounded-full bg-[var(--sketch-border)]">
        <motion.div
          animate={{ width: `${fill}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 17 }}
          className="h-full rounded-full"
          style={{ backgroundColor: fillColor, boxShadow: `0 0 6px rgba(${rgb}, .4)` }}
        />
      </div>
    </motion.article>
  );
}

export function CategoryBudgetPreview({ budgets, compact = false }: { budgets?: Budget[]; compact?: boolean } = {}) {
  const items = budgets ?? [];
  if (!items.length) return <p className="sketch-label py-5 text-center text-[11px] opacity-45">add categories in settings to see budgets</p>;
  return <div className={compact ? "w-full" : "sketch-card mt-8"}>
    {!compact && <div className="mb-4"><p className="sketch-label text-xs uppercase tracking-[0.15em]">category budgets</p><p className="sketch-body mt-1 text-[11px] opacity-60">weekly time poured into each potion</p></div>}
    <div className="flex w-full items-end gap-1 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {items.map((b, i) => <Potion key={b.name} budget={b} delay={i * 0.04} />)}
      </AnimatePresence>
    </div>
  </div>;
}
