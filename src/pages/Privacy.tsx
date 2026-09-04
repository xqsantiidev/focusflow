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
          <p className="sketch-label text-xs mt-2 opacity-40">last updated september 2026</p>
          <div className="mt-8 space-y-8 sketch-body text-sm opacity-65 leading-relaxed">

            <div>
              <h3 className="sketch-title text-base mb-2">account information</h3>
              <p>when you sign up, we collect your email address to create and authenticate your account. that's the only personal identifier we store.</p>
            </div>

            <div>
              <h3 className="sketch-title text-base mb-2">schedule data</h3>
              <p>everything you create in thyme — events, templates, categories, color palettes, and weekly budget targets — is stored securely on our servers and linked to your account. this data powers the app and stays private to you.</p>
            </div>

            <div>
              <h3 className="sketch-title text-base mb-2">device location (optional)</h3>
              <p>if you enable the sunrise/sunset shading feature in settings, thyme will request access to your device's location to calculate daylight hours for your area. this is entirely opt-in. your coordinates are stored locally on your device and are never sent to our servers. you can clear your saved location at any time from the settings panel.</p>
            </div>

            <div>
              <h3 className="sketch-title text-base mb-2">how we use your data</h3>
              <p>your data is used solely to power thyme. we do not sell, share, or monetize your personal information. we do not run ads, and we do not track you across other sites or services.</p>
            </div>

            <div>
              <h3 className="sketch-title text-base mb-2">data storage &amp; security</h3>
              <p>your data is stored on encrypted servers and is accessible only through your authenticated account. we use industry-standard encryption for data in transit (TLS) and at rest.</p>
            </div>

            <div>
              <h3 className="sketch-title text-base mb-2">delete your account &amp; data</h3>
              <p>you can delete your account and all associated data at any time. to do so, visit the settings page in the app and tap <span className="font-medium">delete account</span>. this permanently removes your email, schedule, templates, categories, preferences, and budget targets from our servers. this action cannot be undone.</p>
            </div>

            <div>
              <h3 className="sketch-title text-base mb-2">contact</h3>
              <p>questions about this policy or your data? reach out at <span className="font-medium">privacy@thymeapp.com</span> and we'll get back to you promptly.</p>
            </div>

          </div>
        </motion.div>
      </div>
    </main>
  );
}
