import { motion } from "framer-motion";
import { useNavigate } from "react-router";

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <main className="sketchbook min-h-screen">
      <div className="mx-auto max-w-[520px] px-6 pb-24 pt-10">
        <header className="flex items-center justify-between mb-12">
          <button onClick={() => navigate("/")} className="sketch-link text-sm">← back</button>
          <span className="sketch-title text-xl">thyme<span className="text-[#e55b5b]">.</span></span>
        </header>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="sketch-title text-3xl">privacy policy</h1>
          <p className="sketch-label text-xs mt-2 opacity-40">last updated august 2026</p>
          <div className="mt-8 space-y-6 sketch-body text-sm opacity-65 leading-relaxed">
            <div>
              <h3 className="sketch-title text-base mb-2">what we collect</h3>
              <p>thyme stores your schedule, categories, templates, and preferences in your account. we also collect your email address for sign-in purposes only.</p>
            </div>
            <div>
              <h3 className="sketch-title text-base mb-2">how we use it</h3>
              <p>your data is used solely to power the app. we do not sell, share, or monetize your personal information. we do not run ads or track you across other sites.</p>
            </div>
            <div>
              <h3 className="sketch-title text-base mb-2">data storage</h3>
              <p>your data is stored securely on our servers and is accessible only through your authenticated account. we use industry-standard encryption in transit.</p>
            </div>
            <div>
              <h3 className="sketch-title text-base mb-2">your data, your control</h3>
              <p>you can delete your account and all associated data at any time. no data is retained after account deletion.</p>
            </div>
            <div>
              <h3 className="sketch-title text-base mb-2">contact</h3>
              <p>questions about privacy? reach out anytime — we're happy to clarify anything.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
