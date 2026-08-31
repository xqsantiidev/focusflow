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
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* hand-drawn tilted sheet */}
                    <path d="M6.4 5.6 C11 4.6 19.6 4.8 25.4 5.7 C26.2 12.8 26 21 25.1 26.5 C18.2 27.2 10.4 27 6 26.2 C5.2 19.4 5.5 11.8 6.4 5.6 Z" />
                    {/* wobbly divider */}
                    <path d="M5.8 11.6 C12 10.6 19.8 10.9 25.9 12" />
                    <path d="M12.6 5.4 C12 11 12.2 20 11.8 26.4" />
                    {/* scribbled star */}
                    <path d="M18.8 15.8 l2.6 2.4 -1.6 3 -3.4-.8 -.5-3.2 z" fill="currentColor" opacity="0.3" strokeWidth="1" />
                  </svg>
                ),
              },
              {
                title: "repeating",
                desc: "set blocks to repeat on specific days — schedule once, every week.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* wobbly loop arrows */}
                    <path d="M21.6 3.4 C24 4.8 25.9 6.9 26.7 9 C25 10.7 22.9 12.3 21.3 13.3 C21.7 11 21.9 7.8 21.2 4.6" />
                    <path d="M26.6 9.2 C19 8.5 8.4 8.9 4.5 10.7 C4 12.5 4.2 13.8 4.7 14.8 C9.4 13.5 19 13.2 26.7 9.4" />
                    <path d="M10.4 28.6 C8.1 27.2 6.2 25.3 5.4 23.2 C7 21.4 9.1 19.7 10.7 18.7 C10.2 21 10 24.1 10.7 27.4" />
                    <path d="M5.5 23.2 C13 23.8 23.6 23.3 27.5 21.4 C28 19.6 27.8 18.3 27.3 17.3 C22.5 18.6 12.9 18.9 5.3 22.9" />
                  </svg>
                ),
              },
              {
                title: "palette",
                desc: "pick your own colors for every category — make the wheel yours.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* hand-drawn blobby palette */}
                    <path d="M15.4 3.9 C9.2 3.5 3.7 8.7 3.3 15.5 C2.9 22.3 8.9 28.2 15.5 28.6 C17.1 28.7 18.7 27.7 18.8 25.9 C18.9 24.8 18.4 23.8 17.6 23.2 C16.8 22.6 16.4 21.8 16.4 20.9 C16.5 19 18.1 17.6 19.9 17.6 L23.5 17.9 C26.7 18.1 29.5 15.4 29.3 12.2 C28.9 7 22.5 4.3 15.4 3.9 Z" />
                    <circle cx="10.6" cy="13.7" r="2.2" fill="currentColor" opacity="0.55" />
                    <circle cx="15.9" cy="8.9" r="2.4" fill="currentColor" opacity="0.75" />
                    <circle cx="22.5" cy="11.7" r="2" fill="currentColor" opacity="0.4" />
                    <circle cx="9.6" cy="20.5" r="1.8" fill="currentColor" opacity="0.3" />
                  </svg>
                ),
              },
              {
                title: "stats",
                desc: "busiest days, hourly activity, category ring — see where your time goes.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* wonky bars */}
                    <path d="M5 27.2 C6.2 22 5.8 19 6.4 16.4 C7.6 16.6 9.4 16.5 10.4 16.8 C10.2 20.6 10.5 24.4 10 27.4 Z" fill="currentColor" opacity="0.18" />
                    <path d="M13.6 27.6 C14.4 21 13.8 16.4 14.6 11.2 C15.8 11.4 17.4 11.2 18.6 11.6 C18.4 17 18.8 22.6 18.2 27.8 Z" fill="currentColor" opacity="0.3" />
                    <path d="M22.4 27.4 C23 18 22.6 12 23 5.6 C24.2 5.8 25.8 5.6 26.8 6 C26.6 13 26.8 21 26.2 27.6 Z" fill="currentColor" opacity="0.45" />
                    {/* sketchy baseline */}
                    <path d="M3.6 28.3 C12 29.1 22 28.6 28.6 27.9" strokeDasharray="2.4 2.6" opacity="0.35" />
                  </svg>
                ),
              },
              {
                title: "quick-add",
                desc: "type \"gym 6–7pm\" and hit enter — no forms, no friction.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* dashed sketchy circle */}
                    <path d="M16.3 4.5 C21.2 4.1 26.9 8.2 28.1 13.7 C29.5 20.5 24.4 27.3 17.4 28.1 C10.6 28.9 4.3 24.5 3.8 17.9 C3.3 11 9.5 4.9 16.3 4.5 Z" strokeDasharray="3.2 3" />
                    {/* wobbly plus */}
                    <path d="M16.5 9.4 C15.6 13.4 15.8 18.6 16.2 22.6" />
                    <path d="M9.7 15.9 C14 15.2 19.1 15.5 22.8 16.3" />
                  </svg>
                ),
              },
              {
                title: "dark mode",
                desc: "one tap to switch — late nights, early mornings, your call.",
                icon: (
                  <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {/* hand-drawn crescent */}
                    <path d="M26.3 19.3 C26.7 12.8 21.4 6.7 14.7 6.3 C12.7 9 11.9 12.1 12.1 15.1 C12.7 21.2 17.8 25.6 23.9 26" />
                    <path d="M25.7 18.6 C25.3 12.4 20.3 7.4 14.1 7 C13 9.4 12.4 12 12.6 14.8 C13.2 20.6 18 25 23.6 25.6" fill="currentColor" opacity="0.14" strokeWidth="1" />
                    {/* wobbly stars */}
                    <path d="M22.4 8 l.5 1.5 1.3.6 -1.3.7 -.5 1.5 -.9-1.3 -1.5-.2 1.1-1.3 z" fill="currentColor" opacity="0.55" strokeWidth="0.9" />
                    <path d="M27.2 14.2 l.4 1.1 1.1.5 -1.1.6 -.4 1.1 -.7-1 -1.1-.2 .9-1 z" fill="currentColor" opacity="0.35" strokeWidth="0.9" />
                  </svg>
                ),
              },
            ] as const).map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, x: i % 3 === 0 ? -28 : i % 3 === 1 ? 0 : 28, y: i % 3 === 1 ? 22 : 0, scale: 0.88, rotate: i % 3 === 0 ? -2.5 : i % 3 === 2 ? 2.5 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.04, duration: 0.28, type: "spring", stiffness: 380, damping: 14 }}
                whileHover={{ y: -6, scale: 1.05, rotate: i % 2 === 0 ? -0.6 : 0.6, transition: { duration: 0.1, type: "spring", stiffness: 520, damping: 12 } }}
                className="sketch-card group cursor-default">
                <motion.div whileHover={{ rotate: -9, scale: 1.15 }} transition={{ type: "spring", stiffness: 420, damping: 10 }}
                  className="text-[var(--sketch-muted)] opacity-40 group-hover:opacity-75 transition-opacity w-fit">
                  {f.icon}
                </motion.div>
                <h3 className="sketch-hand text-lg mt-2.5">{f.title}</h3>
                <p className="sketch-body text-[11px] mt-0.5 opacity-45 leading-snug">{f.desc}</p>
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
                <h4 className="sketch-hand text-base">{item.q}</h4>
                <p className="sketch-body text-[11px] mt-2 opacity-50 leading-relaxed">{item.a}</p>
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
