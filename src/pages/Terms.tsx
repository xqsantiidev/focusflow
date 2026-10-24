import { ThymeWordmark } from "@/components/ThymeWordmark";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function Terms() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <main className="sketchbook min-h-screen">
      <div className="mx-auto max-w-[680px] px-6 pb-24 pt-10">
        <header className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/")} className="sketch-link text-sm">← back</button>
          <ThymeWordmark className="text-2xl" />
        </header>
        <motion.div className="legal-document" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="sketch-title text-3xl">terms of service</h1>
          <p className="sketch-label text-xs mt-2 opacity-40">last updated september 2026</p>
          <div className="legal-copy mt-7">

            <section className="legal-section">
              <h3 className="legal-section-title">use of the app</h3>
              <p>thyme is a personal productivity tool. you're welcome to use it however helps you plan your day. we just ask that you don't misuse it, attempt to harm the service, or use it for anything unlawful.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">your content</h3>
              <p>everything you create in thyme — your schedule, templates, categories, and preferences — belongs to you. we claim no ownership over your data.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">accounts</h3>
              <p>you're responsible for keeping your sign-in credentials secure. each account is for one person; sharing accounts is not supported.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">delete your account</h3>
              <p>you can delete your account and all associated data at any time from the settings page. this permanently removes everything — your schedule, templates, categories, and preferences. this action is irreversible.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">age requirement</h3>
              <p>you must be at least 13 years old to use thyme. accounts created by anyone under 13 will be terminated and their data deleted. if you're a parent or guardian and believe your child under 13 has an account, contact us and we'll remove it.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">availability</h3>
              <p>we aim to keep thyme running reliably, but we can't guarantee 100% uptime. we'll always try to communicate about any planned downtime.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">changes to these terms</h3>
              <p>we may update these terms as the app evolves. significant changes will be communicated through the app or by email.</p>
            </section>

            <section className="legal-section">
              <h3 className="legal-section-title">contact</h3>
              <p>anything unclear? reach out at <span className="font-medium">thymeplanner.help@proton.me</span> and we'll sort it out.</p>
            </section>

          </div>
        </motion.div>
      </div>
    </main>
  );
}
