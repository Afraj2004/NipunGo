import React from 'react';

// Small shared pieces so every dashboard looks and behaves the same.

const STATUS_STYLE = {
  'Searching': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Confirmed': 'bg-blue-50 text-blue-700 ring-blue-200',
  'In Progress': 'bg-violet-50 text-violet-700 ring-violet-200',
  'Completed': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Cancelled': 'bg-red-50 text-red-700 ring-red-200',
  'No Workers': 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function StatusChip({ status }) {
  return (
    <span className={`chip ring-1 ring-inset ${STATUS_STYLE[status] || STATUS_STYLE['No Workers']}`}>
      {status}
    </span>
  );
}

// Only meaningful once the work is done
export function PaymentChip({ booking }) {
  if (booking.status !== 'Completed') return null;
  return booking.paymentStatus === 'paid' ? (
    <span className="chip bg-emerald-600 text-white">Paid{booking.paidVia ? ` · ${booking.paidVia}` : ''}</span>
  ) : (
    <span className="chip bg-secondary-100 text-secondary-700 ring-1 ring-inset ring-secondary-200">Payment baaki</span>
  );
}

export function StatCard({ icon: Icon, label, value, tone = 'primary', hint }) {
  const tones = {
    primary: 'bg-primary-50 text-primary',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-secondary-50 text-secondary-600',
  };
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`} aria-hidden="true">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-2xl font-extrabold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400" aria-hidden="true">
        <Icon size={30} />
      </span>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} aria-hidden="true" />;
}

export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// "2026-11-10" + "10:00 AM" -> "Tue, 10 Nov · 10:00 AM"
export const when = (date, time) => {
  if (!date) return time || '';
  const [y, m, d] = String(date).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.toLocaleDateString('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} · ${time}`;
};
