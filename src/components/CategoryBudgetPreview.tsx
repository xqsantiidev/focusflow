import { motion } from "framer-motion";

export type Budget = { name: string; color: string; target: number; used: number };

/* ── Animated Cup ─────────────────────────────────────────── */
function Cup({ budget, delay = 0 }: { budget: Budget; delay?: number }) {
  const fill = Math.min(100, (budget.used / budget.target) * 100);
  const overBudget = budget.used > budget.target;

  return (
    <motion.div layout className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="relative h-36 w-24">
        {/* Cup rim */}
        <div className="absolute left-1/2 top-0 z-10 h-3.5 w-14 -translate-x-1/2 rounded-full border-2 border-[var(--sketch-line)] bg-[var(--sketch-bg)]" />

        {/* Cup body */}
        <div className="absolute inset-x-1.5 top-1 h-32 overflow-hidden rounded-b-[24px] rounded-t-lg border-2 border-[var(--sketch-line)] bg-[var(--sketch-bg)]">
          {/* Liquid fill */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${fill}%` }}
            transition={{ delay: 0.3 + delay, duration: 1.2, type: "spring", stiffness: 50, damping: 14 }}
            className="absolute inset-x-0 bottom-0"
            style={{ backgroundColor: overBudget ? "#e55b5b" : budget.color, opacity: 0.85 }}
          >
            {/* Liquid surface wave */}
            <motion.div
              animate={{ x: ["-10%", "10%", "-10%"], scaleY: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
              className="absolute -top-1.5 left-[-12%] h-4 w-[124%] rounded-[50%]"
              style={{ backgroundColor: `${overBudget ? "#e55b5b" : budget.color}`, opacity: 0.5 }}
            />

            {/* White highlight stripe */}
            <motion.div
              animate={{ x: ["-6%", "6%", "-6%"] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
              className="absolute left-[15%] top-[10%] h-[80%] w-[12%] rounded-full bg-white/20"
            />

            {/* Bubbles */}
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                animate={{
                  y: [8, -50 - i * 8],
                  x: [0, (i % 2 ? 5 : -5)],
                  opacity: [0, 0.8, 0],
                  scale: [0.6, 1, 0.4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8 + i * 0.4,
                  delay: delay + 0.5 + i * 0.6,
                  ease: "easeOut",
                }}
                className="absolute rounded-full bg-white/55"
                style={{
                  left: `${18 + i * 15}%`,
                  bottom: 4,
                  width: 3 + (i % 2),
                  height: 3 + (i % 2),
                }}
              />
            ))}

            {/* Used amount label */}
            <motion.span
              animate={{ y: [0, -1.5, 0] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className="absolute inset-x-0 bottom-3 text-center text-[11px] font-bold text-white"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            >
              {budget.used.toFixed(1)}h
            </motion.span>
          </motion.div>

          {/* Target line */}
          <div className="absolute inset-x-2.5 top-4 border-t border-dashed border-[var(--sketch-line)] opacity-25" />

          {/* Gradient overlay for glass look */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/5 pointer-events-none" />
        </div>

        {/* Cup handle */}
        <span className="absolute -right-3 top-8 h-16 w-6 rounded-r-full border-2 border-l-0 border-[var(--sketch-line)] bg-[var(--sketch-bg)]" />
      </div>

      {/* Labels below */}
      <span className="sketch-label text-[12px] font-medium capitalize">{budget.name}</span>
      <span className="sketch-label text-[10px] opacity-50">{budget.target}h / week</span>
    </motion.div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export function CategoryBudgetPreview({
  budgets,
  compact = false,
}: {
  budgets?: Budget[];
  compact?: boolean;
} = {}) {
  const items = budgets && budgets.length > 0
    ? budgets
    : [
        { name: "study", color: "#e7a83d", target: 8, used: 0 },
        { name: "health", color: "#d96b62", target: 5, used: 0 },
        { name: "life", color: "#7b9b83", target: 6, used: 0 },
        { name: "class", color: "#7792ad", target: 12, used: 0 },
      ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={compact ? "w-full" : "sketch-card mt-8"}
    >
      {!compact && (
        <div className="mb-5">
          <p className="sketch-label text-xs uppercase tracking-[0.15em]">category budgets</p>
          <p className="sketch-body mt-1 text-[11px] opacity-60">weekly time poured into each category</p>
        </div>
      )}
      <div className="flex gap-4 sm:gap-6">
        {items.map((b, i) => (
          <Cup key={b.name} budget={b} delay={i * 0.1} />
        ))}
      </div>
      <p className="sketch-label mt-5 text-center text-[9px] opacity-45">time poured this week · resets every monday</p>
    </motion.section>
  );
}
