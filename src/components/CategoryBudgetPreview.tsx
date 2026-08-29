import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export type Budget = { name: string; color: string; target: number; used: number };

function toRgb(color: string) {
  const value = color.replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(value)
    ? `${parseInt(value.slice(0, 2), 16)}, ${parseInt(value.slice(2, 4), 16)}, ${parseInt(value.slice(4, 6), 16)}`
    : "176, 190, 197";
}

function Battery({ budget, delay = 0 }: { budget: Budget; delay?: number }) {
  const ratio = budget.target > 0 ? budget.used / budget.target : 0;
  const fill = Math.min(100, Math.max(0, ratio * 100));
  const [pulse, setPulse] = useState(false);
  const [previous, setPrevious] = useState({ used: budget.used, target: budget.target });
  const color = budget.color || "#b0bec5";
  const rgb = toRgb(color);

  useEffect(() => {
    if (previous.used === budget.used && previous.target === budget.target) return;
    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), 900);
    setPrevious({ used: budget.used, target: budget.target });
    return () => window.clearTimeout(timer);
  }, [budget.used, budget.target, previous.used, previous.target]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay, type: "spring", stiffness: 330, damping: 23 }}
      className="relative min-w-0 flex-1 rounded-[14px] border border-[var(--sketch-border)] bg-[var(--sketch-bg)]/70 px-1.5 py-2 text-center shadow-[0_3px_0_var(--sketch-border)]"
    >
      <div className="flex items-center justify-between gap-1 px-0.5">
        <span className="sketch-label min-w-0 truncate text-[9px] font-semibold capitalize">{budget.name}</span>
        <motion.span key={`${budget.name}-${fill}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sketch-label shrink-0 text-[8px] opacity-60">{Math.round(fill)}%</motion.span>
      </div>

      <motion.div
        animate={pulse ? { rotate: [-2, 2, -1.5, 1, 0], scale: [1, 1.05, 0.98, 1.02, 1] } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        className="relative mx-auto mt-2 h-[68px] w-[31px]"
      >
        <div className="absolute -top-1 left-1/2 z-20 h-2 w-3.5 -translate-x-1/2 rounded-t-[4px] border-2 border-b-0 border-[var(--sketch-line)] bg-[var(--sketch-card)]" />
        <div className="absolute inset-0 overflow-hidden rounded-[8px_8px_12px_12px] border-2 border-[var(--sketch-line)] bg-[var(--sketch-card)] shadow-[inset_2px_0_0_rgba(255,255,255,.3),inset_-2px_0_0_rgba(0,0,0,.06)]">
          <motion.div
            className="absolute inset-x-0 bottom-0"
            initial={false}
            animate={{ height: `${fill}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 14, mass: 0.65 }}
            style={{ backgroundColor: color, boxShadow: `0 -5px 14px rgba(${rgb}, .35)` }}
          >
            <motion.div
              animate={{ x: pulse ? ["-45%", "35%", "-20%", "20%", "-45%"] : ["-22%", "22%", "-22%"], scaleY: pulse ? [1, 1.9, 0.7, 1.5, 1] : [1, 1.15, 1] }}
              transition={{ duration: pulse ? 0.85 : 2.2, repeat: pulse ? 0 : Infinity, ease: "easeInOut" }}
              className="absolute -top-1.5 left-[-35%] h-3 w-[170%] rounded-[50%] bg-white/40"
            />
            <AnimatePresence>
              {pulse && [0, 1, 2].map(i => (
                <motion.i key={i} initial={{ opacity: 0, y: 2, scale: 0.3 }} animate={{ opacity: [0, 1, 0], y: -22 - i * 7, scale: [0.3, 1, 0.2] }} exit={{ opacity: 0 }} transition={{ duration: 0.75, delay: i * 0.08 }} className="absolute bottom-1 h-1 w-1 rounded-full bg-white/85" style={{ left: `${20 + i * 27}%` }} />
              ))}
            </AnimatePresence>
            {fill > 12 && <span className="absolute inset-x-0 bottom-1 text-[7px] font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,.55)" }}>{budget.used.toFixed(1)}h</span>}
          </motion.div>
          <div className="pointer-events-none absolute inset-y-1 left-1 w-0.5 rounded-full bg-white/30" />
          <div className="pointer-events-none absolute inset-x-1 top-1 h-px bg-white/30" />
        </div>
      </motion.div>

      <p className="sketch-label mt-1 truncate text-[8px] opacity-65">{budget.used.toFixed(1)} / {budget.target.toFixed(1)}h</p>
      <div className="mx-0.5 mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-[var(--sketch-border)]">
        <motion.div animate={{ width: `${fill}%` }} transition={{ type: "spring", stiffness: 90, damping: 17 }} className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
    </motion.article>
  );
}

export function CategoryBudgetPreview({ budgets, compact = false }: { budgets?: Budget[]; compact?: boolean } = {}) {
  const items = budgets ?? [];
  if (!items.length) return <p className="sketch-label py-5 text-center text-[11px] opacity-45">add categories in settings to see budgets</p>;
  return <div className={compact ? "w-full" : "sketch-card mt-8"}>
    {!compact && <div className="mb-4"><p className="sketch-label text-xs uppercase tracking-[0.15em]">category budgets</p><p className="sketch-body mt-1 text-[11px] opacity-60">weekly time poured into each battery</p></div>}
    <div className="flex w-full items-start gap-1 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {items.map((budget, index) => <Battery key={budget.name} budget={budget} delay={index * 0.035} />)}
      </AnimatePresence>
    </div>
  </div>;
}
