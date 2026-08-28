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
          <h1 className="sketch-title text-6xl sm:text-7xl mt-20 leading-[1.05]">
            your day,<br />
            <span className="text-[#8a8678]">drawn out.</span>
          </h1>
          <p className="sketch-body text-lg mt-6 max-w-sm leading-relaxed opacity-60">
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

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="sketch-label text-sm opacity-40">start with one day.</p>
          <h2 className="sketch-title text-4xl mt-2">make it a good one.</h2>
          <button onClick={() => navigate("/auth")} className="sketch-btn-primary mt-6">
            open thyme
          </button>
        </div>
      </div>
    </main>
  );
}
