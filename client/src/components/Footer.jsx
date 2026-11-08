import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, HardHat } from 'lucide-react';
import { showWorkerSite, showCustomerSite } from '../utils/auth';

// A slim footer: who we are, the links people actually need, and how to reach us.
// (The previous one was taller than a phone screen: newsletter, app-store badges, four link columns.)
function Footer() {
  const year = new Date().getFullYear();

  const links = [
    ...(showCustomerSite ? [{ to: '/', label: 'Home' }, { to: '/services', label: 'Services' }] : []),
    { to: '/privacy', label: 'Privacy' },
    { to: '/terms', label: 'Terms' },
    { to: '/refunds', label: 'Refunds' },
  ];

  const linkClass =
    'inline-flex min-h-[44px] items-center px-2 text-sm text-slate-400 transition hover:text-white';

  return (
    <footer className="mt-8 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:pb-6 md:pt-8">
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          {/* Brand */}
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="rounded-lg bg-white p-1">
                <img src="/brand/logo-icon.png" alt="NipunGo logo" className="h-7 w-auto" />
              </span>
              <span className="text-xl font-extrabold text-white">
                Nipun<span className="text-secondary-500">Go</span>
              </span>
            </Link>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Verified experts, ghar baithe. Plumber, electrician, cleaner aur bahut kuch.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer" className="-mx-2 flex flex-wrap items-center">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={linkClass}>{l.label}</Link>
            ))}
            {showWorkerSite && showCustomerSite && (
              <Link to="/worker/login" className={`${linkClass} gap-1.5`}>
                <HardHat size={14} aria-hidden="true" /> Worker login
              </Link>
            )}
          </nav>

          {/* Contact */}
          <div className="-mx-2 flex flex-wrap text-sm md:flex-col md:items-end">
            <a href="mailto:support@nipungo.com" className={`${linkClass} gap-2`}>
              <Mail size={14} aria-hidden="true" /> support@nipungo.com
            </a>
            <a href="tel:+919876543210" className={`${linkClass} gap-2`}>
              <Phone size={14} aria-hidden="true" /> +91 98765 43210
            </a>
          </div>
        </div>

        <p className="mt-3 border-t border-slate-800 pt-3 text-center text-xs text-slate-500 md:mt-6 md:pt-4 md:text-left">
          © {year} NipunGo. All rights reserved. Made in India.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
