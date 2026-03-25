import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const footerLinks = {
    company: [
      { label: "Home", path: "/" },
      { label: "Services", path: "/services" },
      { label: "About Us", path: "/" },
      { label: "Contact", path: "/" },
    ],
    services: [
      { label: "Plumber", path: "/services" },
      { label: "Electrician", path: "/services" },
      { label: "Carpenter", path: "/services" },
      { label: "AC Mechanic", path: "/services" },
      { label: "Cleaner", path: "/services" },
    ],
    support: [
      { label: "FAQ", path: "/" },
      { label: "Privacy Policy", path: "/" },
      { label: "Terms of Service", path: "/" },
      { label: "Refund Policy", path: "/" },
    ],
  };

  const socialLinks = [
    { icon: "📘", label: "Facebook", url: "https://facebook.com" },
    { icon: "📷", label: "Instagram", url: "https://instagram.com" },
    { icon: "🐦", label: "Twitter", url: "https://twitter.com" },
    { icon: "▶️", label: "YouTube", url: "https://youtube.com" },
  ];

  return (
    <footer className="bg-gray-900 text-white">

      {/* ===== NEWSLETTER SECTION ===== */}
      <div className="bg-gradient-to-r from-primary to-indigo-800">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">
              📧 Newsletter Subscribe Karo!
            </h3>
            <p className="text-indigo-200 mb-6">
              Latest offers aur updates pao directly inbox mein!
            </p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl inline-block"
              >
                🎉 Subscribe ho gaye! Thank you!
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="flex gap-2 max-w-md mx-auto"
              >
                <input
                  type="email"
                  placeholder="apna@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-white"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="bg-secondary text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition whitespace-nowrap"
                >
                  Subscribe →
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* ===== MAIN FOOTER ===== */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  N
                </div>
                <h2 className="text-2xl font-bold">
                  Nipun<span className="text-secondary">Go</span>
                </h2>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              India ka trusted home services platform.
              Verified experts, best prices, quality
              guaranteed. Ghar baithe book karo!
            </p>

            {/* Contact Info */}
            <div className="flex flex-col gap-2 mb-6">
              <a
                href="mailto:support@nipungo.com"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"
              >
                <span>📧</span>
                support@nipungo.com
              </a>
              <a
                href="tel:+919876543210"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"
              >
                <span>📞</span>
                +91 98765 43210
              </a>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>📍</span>
                Delhi, India
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3, scale: 1.1 }}
                  className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary transition"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">
              Company
            </h3>
            <div className="flex flex-col gap-2">
              {footerLinks.company.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className="text-gray-400 hover:text-white transition text-sm hover:translate-x-1 transform inline-block"
                >
                  → {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">
              Services
            </h3>
            <div className="flex flex-col gap-2">
              {footerLinks.services.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className="text-gray-400 hover:text-white transition text-sm hover:translate-x-1 transform inline-block"
                >
                  → {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">
              Support
            </h3>
            <div className="flex flex-col gap-2">
              {footerLinks.support.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className="text-gray-400 hover:text-white transition text-sm hover:translate-x-1 transform inline-block"
                >
                  → {link.label}
                </Link>
              ))}
            </div>

            {/* App Download */}
            <div className="mt-6">
              <h4 className="font-bold text-sm mb-3 text-white">
                App Download Karo
              </h4>
              <div className="flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl transition text-sm"
                >
                  <span>🍎</span>
                  <span className="text-gray-300">App Store</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl transition text-sm"
                >
                  <span>🤖</span>
                  <span className="text-gray-300">Play Store</span>
                </motion.button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

            <p className="text-gray-400 text-sm">
              © 2024 NipunGo - All Rights Reserved
            </p>

            {/* Badges */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                🔒 Secure Payments
              </span>
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                ✅ Verified Workers
              </span>
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                ⭐ Quality Assured
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Made with ❤️ in India 🇮🇳
            </p>

          </div>
        </div>
      </div>

    </footer>
  );
}

export default Footer;