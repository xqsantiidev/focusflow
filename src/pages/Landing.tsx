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
                color: "#4caf50",
              },
              {
                title: "repeating",
                desc: "set blocks to repeat on specific days — schedule once, every week.",
                color: "#ffc107",
              },
              {
                title: "palette",
                desc: "pick your own colors for every category — make the wheel yours.",
                color: "#e91e63",
              },
              {
                title: "stats",
                desc: "busiest days, hourly activity, category ring — see where your time goes.",
                color: "#2196f3",
              },
              {
                title: "quick-add",
                desc: "type \"gym 6–7pm\" and hit enter — no forms, no friction.",
                color: "#9c27b0",
              },
              {
                title: "dark mode",
                desc: "one tap to switch — late nights, early mornings, your call.",
                color: "#607d8b",
              },
            ] as const).map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, x: i % 3 === 0 ? -20 : i % 3 === 1 ? 0 : 20, y: i % 3 === 1 ? 15 : 0, scale: 0.95 }}
                whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.07, duration: 0.45, type: "spring", stiffness: 180, damping: 20 }}
                whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                className="sketch-card group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: f.color }}>
                    {f.title[0]!.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="sketch-title text-[15px]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{f.title}</h3>
                    <p className="sketch-body text-[11px] mt-0.5 opacity-50 leading-snug" style={{ fontFamily: "'Space Mono', monospace" }}>{f.desc}</p>
                  </div>
                </div>
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
