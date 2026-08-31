import { motion } from "framer-motion";
import { useNavigate } from "react-router";

export default function Terms() {
  const navigate = useNavigate();
  return (
    <main className="sketchbook min-h-screen">
      <div className="mx-auto max-w-[520px] px-6 pb-24 pt-10">
        <header className="flex items-center justify-between mb-12">
          <button onClick={() => navigate("/")} className="sketch-link text-sm">← back</button>
          <span className="sketch-title text-xl">thyme<span className="text-[#e55b5b]">.</span></span>
        </header>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="sketch-title text-3xl">terms of service</h1>
          <p className="sketch-label text-xs mt-2 opacity-40">last updated august 2026</p>
          <div className="mt-8 space-y-6 sketch-body text-sm opacity-65 leading-relaxed">
            <div>
              <h3 className="sketch-title text-base mb-2">use of the app</h3>
              <p>thyme is a personal productivity tool. you're welcome to use it however helps you plan your day. we just ask that you don't misuse it or attempt to harm the service.</p>
            </div>
            <div>
              <h3 className="sketch-title text-base mb-2">your content</h3>
              <p>everything you create in thyme — your schedule, templates, categories — belongs to you. we claim no ownership over your data.</p>
            </div>
            <div>
              <h3 className="sketch-title text-base mb-2">availability</h3>
              <p>we aim to keep thyme running reliably, but we can't guarantee 100% uptime. we'll always try to communicate about any planned downtime.</p>
            </div>
            <div>
              <h3 className="sketch-title text-base mb-2">changes</h3>
              <p>we may update these terms as the app evolves. significant changes will be communicated through the app or by email.</p>
            </div>
            <div>
              <h3 className="sketch-title text-base mb-2">contact</h3>
              <p>anything unclear? reach out and we'll sort it out.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
