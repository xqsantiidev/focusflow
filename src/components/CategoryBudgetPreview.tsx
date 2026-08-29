import { motion, AnimatePresence } from "framer-motion";

export type Budget = { name: string; color: string; target: number; used: number };

function Bottle({ budget, delay = 0 }: { budget: Budget; delay?: number }) {
  const ratio = budget.target > 0 ? budget.used / budget.target : 0;
  const fill = Math.min(100, Math.max(0, ratio * 100));
  const over = ratio > 1;
  const color = over ? "#e55b5b" : budget.color;

  return (
    <motion.article layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay, type: "spring", stiffness: 240, damping: 22 }} className="min-w-0 flex-1 rounded-xl border border-[var(--sketch-border)] bg-[var(--sketch-bg)]/60 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-1">
        <span className="sketch-label min-w-0 truncate text-[11px] font-medium capitalize">{budget.name}</span>
        <span className="sketch-label shrink-0 text-[10px] opacity-60">{Math.round(fill)}%</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative mx-auto h-28 w-14 shrink-0">
          <div className="absolute left-1/2 top-0 z-10 h-3 w-7 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-[var(--sketch-line)] bg-[var(--sketch-card)]" />
          <div className="absolute inset-x-1 top-2 h-[102px] overflow-hidden rounded-[10px_10px_17px_17px] border-2 border-[var(--sketch-line)] bg-[var(--sketch-card)] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]">
            <motion.div initial={{ height: 0 }} animate={{ height: `${fill}%` }} transition={{ type: "spring", stiffness: 55, damping: 13 }} className="absolute inset-x-0 bottom-0" style={{ backgroundColor: color, opacity: 0.86 }}>
              <motion.div animate={{ x: ["-12%", "12%", "-12%"], scaleY: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut" }} className="absolute -top-1 left-[-15%] h-3 w-[130%] rounded-[50%] bg-white/30" />
              {[0, 1, 2].map(i => <motion.i key={i} animate={{ y: [8, -34 - i * 8], x: [0, i % 2 ? 3 : -2], opacity: [0, 0.8, 0], scale: [0.5, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.7 + i * 0.3, delay: delay + i * 0.4 }} className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-white/70" style={{ left: `${22 + i * 24}%` }} />)}
              <span className="absolute inset-x-0 bottom-2 text-center text-[9px] font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>{budget.used.toFixed(1)}h</span>
            </motion.div>
            <div className="pointer-events-none absolute inset-y-2 left-2 w-1 rounded-full bg-white/20" />
          </div>
          <div className="absolute -right-2 top-7 h-11 w-4 rounded-r-full border-2 border-l-0 border-[var(--sketch-line)]" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="sketch-label text-[10px] opacity-60">{budget.used.toFixed(1)} hours used</p>
          <p className="sketch-label text-[10px] opacity-45">{budget.target.toFixed(1)} hour target</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--sketch-border)]"><motion.div animate={{ width: `${fill}%` }} transition={{ type: "spring", stiffness: 80, damping: 16 }} className="h-full rounded-full" style={{ backgroundColor: color }} /></div>
          {over && <p className="text-[9px] font-medium text-[#e55b5b]">over target</p>}
        </div>
      </div>
    </motion.article>
  );
}

export function CategoryBudgetPreview({ budgets, compact = false }: { budgets?: Budget[]; compact?: boolean } = {}) {
  const items = budgets ?? [];
  if (!items.length) return <p className="sketch-label py-5 text-center text-[11px] opacity-45">add categories in settings to see budgets</p>;
  return <div className={compact ? "w-full" : "sketch-card mt-8"}>
    {!compact && <div className="mb-4"><p className="sketch-label text-xs uppercase tracking-[0.15em]">category budgets</p><p className="sketch-body mt-1 text-[11px] opacity-60">weekly time poured into each bottle</p></div>}
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><AnimatePresence mode="popLayout">{items.map((b, i) => <Bottle key={b.name} budget={b} delay={i * 0.06} />)}</AnimatePresence></div>
  </div>;
}
