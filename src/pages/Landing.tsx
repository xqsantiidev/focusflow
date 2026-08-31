import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
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

        {/* Sketch circle preview */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }} className="mt-16">
          <svg viewBox="0 0 400 400" className="w-full max-w-[380px] mx-auto">
            {/* Outer dotted guide */}
            <circle cx="200" cy="200" r="175" fill="none" stroke="#b8b4a8" strokeWidth="1.5" strokeDasharray="3 8" opacity="0.5" />
            {/* Segments */}
            <path d="M 200 130 L 200 50 A 150 150 0 0 1 285 75 L 215 140 A 70 70 0 0 0 200 130 Z" fill="#4caf50" stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 215 140 L 285 75 A 150 150 0 0 1 340 165 L 240 195 A 70 70 0 0 0 215 140 Z" fill="#ffc107" stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 240 195 L 340 165 A 150 150 0 0 1 330 270 L 235 230 A 70 70 0 0 0 240 195 Z" fill="#9c27b0" stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 235 230 L 330 270 A 150 150 0 0 1 270 340 L 210 255 A 70 70 0 0 0 235 230 Z" fill="#e91e63" stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 210 255 L 270 340 A 150 150 0 0 1 150 340 L 170 245 A 70 70 0 0 0 210 255 Z" fill="#ffc107" stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 170 245 L 150 340 A 150 150 0 0 1 65 250 L 155 195 A 70 70 0 0 0 170 245 Z" fill="#2196f3" stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 155 195 L 65 250 A 150 150 0 0 1 65 130 L 160 170 A 70 70 0 0 0 155 195 Z" fill="#e91e63" stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 160 170 L 65 130 A 150 150 0 0 1 200 50 L 200 130 A 70 70 0 0 0 160 170 Z" fill="#ffc107" stroke="#1a1a18" strokeWidth="2" strokeLinejoin="round" />
            {/* Inner circle */}
            <circle cx="200" cy="200" r="70" fill="#faf8f0" stroke="#1a1a18" strokeWidth="2.5" />
            <text x="200" y="195" textAnchor="middle" className="sketch-title" fontSize="28" fill="#3a3830">5/28</text>
            <text x="200" y="218" textAnchor="middle" className="sketch-title" fontSize="14" fill="#8a8678">Thursday</text>
          </svg>
        </motion.div>

        {/* Features */}
        <div className="mt-16 space-y-6">
          {[
            { title: "see your whole day", desc: "one colorful circle, every block in place.", color: "#4caf50" },
            { title: "tap to add", desc: "open space on the ring? just tap it.", color: "#ffc107" },
            { title: "your sketchbook", desc: "colors, patterns, and a planner that feels like yours.", color: "#e91e63" },
          ].map(f => (
            <motion.div key={f.title} initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="sketch-card">
              <span className="sketch-dot" style={{ backgroundColor: f.color }} />
              <h3 className="sketch-title text-lg mt-3">{f.title}</h3>
              <p className="sketch-body text-sm mt-1 opacity-55">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Feature Showcase */}
        <div className="mt-20">
          <h2 className="hero-display text-3xl sm:text-4xl text-center">everything you need.</h2>
          <p className="sketch-body text-sm text-center mt-2 opacity-50 max-w-xs mx-auto">more features, less friction. plan faster, see clearer.</p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              {
                title: "templates",
                desc: "save any day as a template and reuse it with one tap.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="5" width="22" height="22" rx="2" />
                    <path d="M12 5v22M5 12h22" />
                    <circle cx="19" cy="19" r="3" fill="currentColor" opacity="0.15" />
                  </svg>
                ),
              },
              {
                title: "repeating",
                desc: "set blocks to repeat on specific days — schedule once, every week.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4l5 5-5 5" />
                    <path d="M5 14v-2a4 4 0 0 1 4-4h19" />
                    <path d="M10 28l-5-5 5-5" />
                    <path d="M27 18v2a4 4 0 0 1-4 4H5" />
                  </svg>
                ),
              },
              {
                title: "palette",
                desc: "pick your own colors for every category — make the wheel yours.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13c1.7 0 3-1.3 3-3 0-.8-.3-1.5-.8-2-.5-.5-.8-1.2-.8-2 0-1.7 1.3-3 3-3h3.5c4.1 0 7.5-3.4 7.5-7.5C31.2 8 24.3 3 16 3z" />
                    <circle cx="11" cy="13" r="2" fill="currentColor" opacity="0.6" />
                    <circle cx="16" cy="9" r="2" fill="currentColor" opacity="0.8" />
                    <circle cx="21" cy="13" r="2" fill="currentColor" opacity="0.4" />
                  </svg>
                ),
              },
              {
                title: "stats",
                desc: "busiest days, hourly activity, category ring — see where your time goes.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="16" width="6" height="12" rx="1" fill="currentColor" opacity="0.2" />
                    <rect x="13" y="10" width="6" height="18" rx="1" fill="currentColor" opacity="0.35" />
                    <rect x="22" y="4" width="6" height="24" rx="1" fill="currentColor" opacity="0.5" />
                    <path d="M4 28h24" strokeDasharray="2 2" opacity="0.3" />
                  </svg>
                ),
              },
              {
                title: "quick-add",
                desc: "type \"gym 6–7pm\" and hit enter — no forms, no friction.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 6v20M6 16h20" />
                    <circle cx="16" cy="16" r="12" strokeDasharray="3 4" />
                    <path d="M26 6l4-4M26 6h-4M26 6v4" strokeWidth="1.2" opacity="0.5" />
                  </svg>
                ),
              },
              {
                title: "dark mode",
                desc: "one tap to switch — late nights, early mornings, your call.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M27 17.3A12 12 0 1 1 14.7 5 9 9 0 0 0 27 17.3z" fill="currentColor" opacity="0.15" />
                    <circle cx="22" cy="8" r="1" fill="currentColor" opacity="0.4" />
                    <circle cx="26" cy="14" r="0.7" fill="currentColor" opacity="0.3" />
                  </svg>
                ),
              },
            ] as const).map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, x: i % 3 === 0 ? -24 : i % 3 === 1 ? 0 : 24, y: i % 3 === 1 ? 18 : 0, scale: 0.92 }}
                whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05, duration: 0.35, type: "spring", stiffness: 220, damping: 18 }}
                whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.15, type: "spring", stiffness: 400, damping: 15 } }}
                className="sketch-card group cursor-default">
                <motion.div whileHover={{ rotate: -6, scale: 1.1 }} transition={{ type: "spring", stiffness: 300, damping: 12 }}
                  className="text-[var(--sketch-muted)] opacity-40 group-hover:opacity-70 transition-opacity w-fit">
                  {f.icon}
                </motion.div>
                <h3 className="mt-2.5" style={{ fontFamily: "'Caveat', cursive", fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--sketch-fg)" }}>{f.title}</h3>
                <p className="sketch-body text-[11px] mt-0.5 opacity-45 leading-snug" style={{ fontFamily: "'Space Mono', monospace" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

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
                <h4 className="sketch-title text-sm" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{item.q}</h4>
                <p className="sketch-body text-[11px] mt-2 opacity-50 leading-relaxed" style={{ fontFamily: "'Space Mono', monospace" }}>{item.a}</p>
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
    </main>
  );
}
