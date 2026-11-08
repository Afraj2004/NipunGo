import React from 'react';
import {
  Wrench, Zap, Hammer, PaintRoller, Snowflake, Sparkles,
  KeyRound, Sprout, Laptop, Shirt, Bug, ShowerHead,
} from 'lucide-react';

// One consistent icon + colour per service (replaces the emoji, which look different on every phone).
const SERVICES = {
  'Plumber':         { Icon: Wrench,      tint: 'bg-sky-50 text-sky-600' },
  'Electrician':     { Icon: Zap,         tint: 'bg-amber-50 text-amber-600' },
  'Carpenter':       { Icon: Hammer,      tint: 'bg-orange-50 text-orange-700' },
  'Painter':         { Icon: PaintRoller, tint: 'bg-fuchsia-50 text-fuchsia-600' },
  'AC Mechanic':     { Icon: Snowflake,   tint: 'bg-cyan-50 text-cyan-600' },
  'Cleaner':         { Icon: Sparkles,    tint: 'bg-emerald-50 text-emerald-600' },
  'Locksmith':       { Icon: KeyRound,    tint: 'bg-slate-100 text-slate-700' },
  'Gardener':        { Icon: Sprout,      tint: 'bg-green-50 text-green-600' },
  'IT Support':      { Icon: Laptop,      tint: 'bg-indigo-50 text-indigo-600' },
  'Laundry':         { Icon: Shirt,       tint: 'bg-violet-50 text-violet-600' },
  'Pest Control':    { Icon: Bug,         tint: 'bg-rose-50 text-rose-600' },
  'Bathroom Fitter': { Icon: ShowerHead,  tint: 'bg-teal-50 text-teal-600' },
};
const FALLBACK = { Icon: Wrench, tint: 'bg-slate-100 text-slate-600' };

// size: tile size in px (the glyph is ~half of it)
function ServiceIcon({ service, size = 48, className = '' }) {
  const { Icon, tint } = SERVICES[service] || FALLBACK;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl ${tint} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </span>
  );
}

export default ServiceIcon;
