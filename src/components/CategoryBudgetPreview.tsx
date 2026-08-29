import { motion } from "framer-motion";

type Budget = { name: string; color: string; target: number; used: number };

const previewBudgets: Budget[] = [
  { name: "study", color: "#e7a83d", target: 8, used: 5.5 },
  { name: "health", color: "#d96b62", target: 5, used: 3.25 },
  { name: "life", color: "#7b9b83", target: 6, used: 4.75 },
  { name: "class", color: "#7792ad", target: 12, used: 9 },
];

function Jar({ budget }: { budget: Budget }) {
  const fill = Math.min(100, (budget.used / budget.target) * 100);
  return (
    <motion.div layout className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="relative h-28 w-16 overflow-hidden rounded-b-[18px] rounded-t-md border-2 border-[var(--sketch-line)] bg-[var(--sketch-bg)] shadow-sm">
        <motion.div initial={{ height: 0 }} animate={{ height: `${fill}%` }} transition={{ delay: 0.15, duration: 0.8, type: "spring" }} className="absolute inset-x-0 bottom-0" style={{ backgroundColor: budget.color, opacity: 0.8 }} />
        <div className="absolute inset-x-2 top-2 border-t border-dashed border-[var(--sketch-line)] opacity-40" />
        <div className="absolute inset-x-2 bottom-2 border-t border-dashed border-white/50" />
        <motion.span animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 2.2 }} className="absolute inset-x-0 bottom-2 text-center text-[10px] font-semibold text-white drop-shadow-sm">{budget.used}h</motion.span>
      </div>
      <span className="sketch-label text-[11px]">{budget.name}</span>
      <span className="sketch-label text-[9px] opacity-50">{budget.target}h / week</span>
    </motion.div>
  );
}

export function CategoryBudgetPreview() {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="sketch-card mt-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="sketch-label text-xs uppercase tracking-[0.15em]">category budgets</p>
          <p className="sketch-body mt-1 text-[11px] opacity-60">a visual preview — weekly jars are not saved yet</p>
        </div>
        <span className="rounded-full border border-[#e5a93d]/50 bg-[#e5a93d]/10 px-2 py-1 text-[9px] uppercase tracking-wider text-[#b47a19]">preview</span>
      </div>
      <div className="flex gap-3 sm:gap-5">{previewBudgets.map(budget => <Jar key={budget.name} budget={budget} />)}</div>
      <p className="sketch-label mt-5 text-center text-[9px] opacity-45">time poured this week · resets every monday</p>
    </motion.section>
  );
}
