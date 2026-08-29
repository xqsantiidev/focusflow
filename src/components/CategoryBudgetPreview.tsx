import { motion, AnimatePresence } from "framer-motion";

export type Budget = { name: string; color: string; target: number; used: number };

/* ── Animated Cup ─────────────────────────────────────────── */
function Cup({ budget, delay = 0 }: { budget: Budget; delay?: number }) {
  const fill = Math.min(100, (budget.used / budget.target) * 100);
  const overBudget = budget.used > budget.target;
  const liquidColor = overBudget ? "#e55b5b" : budget.color;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.9 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 22 }}
      className="flex flex-1 min-w-0 flex-col items-center gap-1.5"
    >
      {/* Cup container */}
      <div className="relative h-28 w-[52px]">
        {/* Rim */}
        <div className="absolute left-1/2 top-0 z-10 h-2 w-12 -translate-x-1/2 rounded-full border-[1.5px] border-[var(--sketch-line)] bg-[var(--sketch-bg)]" />

        {/* Body */}
        <div className="absolute inset-x-0.5 top-0.5 h-[102px] overflow-hidden rounded-b-[16px] rounded-t-md border-[1.5px] border-[var(--sketch-line)] bg-[var(--sketch-bg)]">
          {/* Liquid */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${fill}%` }}
            transition={{ delay: 0.2 + delay, duration: 1, type: "spring", stiffness: 45, damping: 14 }}
            className="absolute inset-x-0 bottom-0"
            style={{ backgroundColor: liquidColor, opacity: 0.82 }}
          >
            {/* Surface wave */}
            <motion.div
              animate={{ x: ["-8%", "8%", "-8%"], scaleY: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              className="absolute -top-1 left-[-10%] h-3 w-[120%] rounded-[50%]"
              style={{ backgroundColor: liquidColor, opacity: 0.45 }}
            />

            {/* Glass highlight */}
            <motion.div
              animate={{ x: ["-4%", "4%", "-4%"] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute left-[18%] top-[8%] h-[85%] w-[14%] rounded-full bg-white/18"
            />

            {/* Bubbles */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ y: [6, -36 - i * 6], x: [0, i % 2 ? 3 : -3], opacity: [0, 0.7, 0], scale: [0.5, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.6 + i * 0.35, delay: delay + 0.4 + i * 0.5, ease: "easeOut" }}
                className="absolute rounded-full bg-white/50"
                style={{ left: `${20 + i * 25}%`, bottom: 3, width: 2.5, height: 2.5 }}
              />
            ))}

            {/* Hours label */}
            <motion.span
              animate={{ y: [0, -1, 0] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="absolute inset-x-0 bottom-2 text-center text-[9px] font-bold text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
            >
              {budget.used.toFixed(1)}h
            </motion.span>
          </motion.div>

          {/* Target line */}
          <div className="absolute inset-x-1.5 top-3 border-t border-dashed border-[var(--sketch-line)] opacity-20" />

          {/* Glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/8 via-transparent to-black/4 pointer-events-none" />
        </div>

        {/* Handle */}
        <span className="absolute -right-2 top-6 h-12 w-4 rounded-r-full border-[1.5px] border-l-0 border-[var(--sketch-line)] bg-[var(--sketch-bg)]" />
      </div>

      {/* Labels */}
      <span className="sketch-label text-[10px] font-medium capitalize leading-tight text-center">{budget.name}</span>
      <span className="sketch-label text-[9px] opacity-40">{budget.used.toFixed(1)}/{budget.target}h</span>
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
    : [];

  if (items.length === 0) {
    return (
      <p className="sketch-label text-[11px] opacity-40 text-center py-4">
        add categories in settings to see budgets
      </p>
    );
  }

  return (
    <div className={compact ? "w-full" : "sketch-card mt-8"}>
      {!compact && (
        <div className="mb-4">
          <p className="sketch-label text-xs uppercase tracking-[0.15em]">category budgets</p>
          <p className="sketch-body mt-1 text-[11px] opacity-60">weekly time poured into each category</p>
        </div>
      )}
      <div className="flex gap-2 sm:gap-3 justify-center">
        <AnimatePresence mode="popLayout">
          {items.map((b, i) => (
            <Cup key={b.name} budget={b} delay={i * 0.08} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
