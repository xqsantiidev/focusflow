import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export type Budget = { name: string; color: string; target: number; used: number };

function Potion({ budget, delay = 0 }: { budget: Budget; delay?: number }) {
  const ratio = budget.target > 0 ? budget.used / budget.target : 0;
  const fill = Math.min(100, Math.max(0, ratio * 100));
  const [sloshing, setSloshing] = useState(false);
  const [previous, setPrevious] = useState({ used: budget.used, target: budget.target });

  useEffect(() => {
    if (previous.used !== budget.used || previous.target !== budget.target) {
      setSloshing(true);
      const timer = window.setTimeout(() => setSloshing(false), 850);
      setPrevious({ used: budget.used, target: budget.target });
      return () => window.clearTimeout(timer);
    }
  }, [budget.used, budget.target, previous.used, previous.target]);

  const color = budget.color || "#b0bec5";
  const darker = color.replace(/^#/, "");
  const rgb = darker.length === 6
    ? `${parseInt(darker.slice(0, 2), 16)}, ${parseInt(darker.slice(2, 4), 16)}, ${parseInt(darker.slice(4, 6), 16)}`
    : "176, 190, 197";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={{ delay, type: "spring", stiffness: 320, damping: 22 }}
      className="min-w-0 flex-1 rounded-xl border border-[var(--sketch-border)] bg-[var(--sketch-bg)]/55 px-1.5 py-2 text-center"
      style={{ minWidth: 0 }}
    >
      <div className="flex items-center justify-between gap-1 px-0.5">
        <span className="sketch-label min-w-0 truncate text-[9px] font-medium capitalize">{budget.name}</span>
        <motion.span
          key={`${budget.name}-${fill}`}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          className="sketch-label shrink-0 text-[8px] opacity-60"
        >{Math.round(fill)}%</motion.span>
      </div>

      <motion.div
        animate={sloshing ? { rotate: [-2, 2, -1.5, 1, 0], scaleX: [1, 1.07, 0.96, 1.03, 1] } : { rotate: 0, scaleX: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative mx-auto mt-1 h-[62px] w-[34px]"
      >
        <div className="absolute left-1/2 top-0 z-10 h-2 w-4 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-[var(--sketch-line)] bg-[var(--sketch-card)]" />
        <div className="absolute inset-x-0.5 top-1.5 h-[58px] overflow-hidden rounded-[7px_7px_11px_11px] border-2 border-[var(--sketch-line)] bg-[var(--sketch-card)] shadow-[inset_0_0_0_1px_rgba(255,255,255,.18)]">
          <motion.div
            animate={{ height: `${fill}%` }}
            transition={{ type: "spring", stiffness: 75, damping: 13, mass: 0.7 }}
            className="absolute inset-x-0 bottom-0"
            style={{ backgroundColor: color, boxShadow: `0 -4px 12px rgba(${rgb}, .3)` }}
          >
            <motion.div
              animate={{ x: sloshing ? ["-35%", "30%", "-18%", "18%", "-35%"] : ["-18%", "18%", "-18%"], scaleY: sloshing ? [1, 1.8, 0.65, 1.45, 1] : [1, 1.18, 1] }}
              transition={{ duration: sloshing ? 0.8 : 2, repeat: sloshing ? 0 : Infinity, ease: "easeInOut" }}
              className="absolute -top-1.5 left-[-30%] h-3 w-[160%] rounded-[50%] bg-white/35"
            />
            <AnimatePresence>
              {sloshing && [0, 1, 2, 3].map(i => (
                <motion.i
                  key={i}
                  initial={{ y: 3, opacity: 0, scale: 0.3 }}
                  animate={{ y: -18 - (i % 2) * 10, opacity: [0, 1, 0], scale: [0.4, 1, 0.2] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.72, delay: i * 0.06, ease: "easeOut" }}
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-white/80"
                  style={{ left: `${18 + i * 21}%` }}
                />
              ))}
            </AnimatePresence>
            <span className="absolute inset-x-0 bottom-1 text-[7px] font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,.5)" }}>{budget.used.toFixed(1)}h</span>
          </motion.div>
          <div className="pointer-events-none absolute inset-y-1 left-1 w-0.5 rounded-full bg-white/25" />
        </div>
      </motion.div>

      <p className="sketch-label mt-1 truncate text-[8px] opacity-60">{budget.used.toFixed(1)} / {budget.target.toFixed(1)}h</p>
      <div className="mx-0.5 mt-1 h-1 overflow-hidden rounded-full bg-[var(--sketch-border)]">
        <motion.div animate={{ width: `${fill}%` }} transition={{ type: "spring", stiffness: 90, damping: 17 }} className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
    </motion.article>
  );
}

export function CategoryBudgetPreview({ budgets, compact = false }: { budgets?: Budget[]; compact?: boolean } = {}) {
  const items = budgets ?? [];
  if (!items.length) return <p className="sketch-label py-5 text-center text-[11px] opacity-45">add categories in settings to see budgets</p>;
  return <div className={compact ? "w-full" : "sketch-card mt-8"}>
    {!compact && <div className="mb-4"><p className="sketch-label text-xs uppercase tracking-[0.15em]">category budgets</p><p className="sketch-body mt-1 text-[11px] opacity-60">weekly time poured into each potion</p></div>}
    <div className="flex w-full items-start gap-1.5 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {items.map((b, i) => <Potion key={b.name} budget={b} delay={i * 0.04} />)}
      </AnimatePresence>
    </div>
  </div>;
}
