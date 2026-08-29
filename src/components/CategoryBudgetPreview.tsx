import { motion, AnimatePresence } from "framer-motion";

export type Budget = { name: string; color: string; target: number; used: number };

function Potion({ budget, delay = 0 }: { budget: Budget; delay?: number }) {
  const ratio = budget.target > 0 ? budget.used / budget.target : 0;
  const fill = Math.min(100, Math.max(0, ratio * 100));
  const over = ratio > 1;
  const color = over ? "#e55b5b" : budget.color;

  return (
    <motion.article layout initial={{ opacity: 0, scale: 0.86, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay, type: "spring", stiffness: 300, damping: 20 }} className="relative min-w-0 rounded-2xl border border-[var(--sketch-border)] bg-[var(--sketch-bg)]/45 p-2 text-center">
      <div className="mb-1 flex items-center justify-between gap-1 px-0.5"><span className="sketch-label min-w-0 truncate text-[10px] font-medium capitalize">{budget.name}</span><span className="sketch-label text-[9px] opacity-55">{Math.round(fill)}%</span></div>
      <div className="relative mx-auto h-[76px] w-[42px]">
        <div className="absolute left-1/2 top-0 z-10 h-2.5 w-5 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-[var(--sketch-line)] bg-[var(--sketch-card)]" />
        <div className="absolute inset-x-0.5 top-2 h-[70px] overflow-hidden rounded-[8px_8px_14px_14px] border-2 border-[var(--sketch-line)] bg-[var(--sketch-card)]">
          <motion.div initial={{ height: 0 }} animate={{ height: `${fill}%` }} transition={{ type: "spring", stiffness: 62, damping: 14 }} className="absolute inset-x-0 bottom-0" style={{ backgroundColor: color, opacity: 0.88 }}>
            <motion.div animate={{ x: ["-20%", "20%", "-20%"], scaleY: [1, 1.35, 1] }} transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }} className="absolute -top-1 left-[-20%] h-2.5 w-[140%] rounded-[50%] bg-white/35" />
            {[0, 1].map(i => <motion.i key={i} animate={{ y: [5, -24 - i * 7], opacity: [0, 0.85, 0], scale: [0.5, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.45 + i * 0.35, delay: delay + i * 0.45 }} className="absolute bottom-1 h-1 w-1 rounded-full bg-white/75" style={{ left: `${25 + i * 28}%` }} />)}
            <span className="absolute inset-x-0 bottom-1 text-[8px] font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,.45)" }}>{budget.used.toFixed(1)}h</span>
          </motion.div>
          <div className="pointer-events-none absolute inset-y-1.5 left-1.5 w-1 rounded-full bg-white/20" />
        </div>
      </div>
      <p className="sketch-label mt-1 text-[9px] opacity-55">{budget.used.toFixed(1)} / {budget.target.toFixed(1)}h</p>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--sketch-border)]"><motion.div animate={{ width: `${fill}%` }} transition={{ type: "spring", stiffness: 90, damping: 17 }} className="h-full rounded-full" style={{ backgroundColor: color }} /></div>
    </motion.article>
  );
}

export function CategoryBudgetPreview({ budgets, compact = false }: { budgets?: Budget[]; compact?: boolean } = {}) {
  const items = budgets ?? [];
  if (!items.length) return <p className="sketch-label py-5 text-center text-[11px] opacity-45">add categories in settings to see budgets</p>;
  return <div className={compact ? "w-full" : "sketch-card mt-8"}>
    {!compact && <div className="mb-4"><p className="sketch-label text-xs uppercase tracking-[0.15em]">category budgets</p><p className="sketch-body mt-1 text-[11px] opacity-60">weekly time poured into each potion</p></div>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"><AnimatePresence mode="popLayout">{items.map((b, i) => <Potion key={b.name} budget={b} delay={i * 0.05} />)}</AnimatePresence></div>
  </div>;
}
