import { ThymeWordmark } from "@/components/ThymeWordmark";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function Privacy() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <main className="sketchbook legal-page min-h-screen">
      <div className="mx-auto max-w-[820px] px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
        <header className="flex items-center justify-between mb-10">
          <button onClick={() => navigate("/")} className="sketch-link text-sm">← back</button>
          <ThymeWordmark className="text-2xl" />
        </header>
        <motion.div className="legal-document" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-8 border-b border-[var(--sketch-border)] pb-7">
            <p className="sketch-label text-[10px] tracking-[0.16em]">thyme · your data</p>
            <h1 className="legal-page-title mt-3">privacy policy</h1>
            <p className="legal-updated mt-4">last updated · september 2026</p>
          </div>
          <div className="legal-copy">

            <section className="legal-section">
              <h3 className="legal-section-title">account information</h3>
              <p>when you sign up, we collect your email address to create and authenticate your account. that's the only personal identifier we store.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">schedule data</h3>
              <p>everything you create in thyme — events, templates, categories, and color palettes — is stored on our servers and linked to your account. this data powers the app and stays private to you.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">device location (optional)</h3>
              <p>if you enable the sunrise/sunset shading feature in settings, thyme will request access to your device's location to calculate daylight hours for your area. this is entirely opt-in. your coordinates are stored locally on your device and are never sent to our servers. you can clear your saved location at any time from the settings panel.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">how we use your data</h3>
              <p>your data is used solely to power thyme. we do not sell, share, or monetize your personal information. we do not run ads, and we do not track you across other sites or services.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">data storage &amp; security</h3>
              <p>your data is stored on our servers and is accessible only through your authenticated account. data sent between your device and our servers is encrypted in transit (TLS).</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">delete your account &amp; data</h3>
              <p>you can delete your account and all associated data at any time. to do so, visit the settings page in the app and tap <span className="font-medium">delete account</span>. this permanently removes your email, schedule, templates, categories, and preferences from our servers. this action cannot be undone.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">age requirement</h3>
              <p>you must be 13 or older to use thyme. we don't knowingly collect personal information from anyone under 13; if we learn an account belongs to a child under 13, we will delete it and its data.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">contact</h3>
              <p>questions about this policy or your data? reach out at <span className="font-medium">thymeplanner.help@proton.me</span> and we'll get back to you promptly.</p>
            </section>

          </div>
        </motion.div>
      </div>
    </main>
  );
}
