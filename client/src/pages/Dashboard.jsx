import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, ClipboardList, Hourglass, CheckCircle2, Wallet, CreditCard, MapPin, ChevronRight,
  Star, RotateCcw, XCircle, Loader2, AlertTriangle, CalendarX, Sparkles, BadgeCheck,
} from 'lucide-react';
import axios from '../utils/axios';
import ServiceIcon from '../components/ServiceIcon';
import CallButton from '../components/CallButton';
import { StatusChip, PaymentChip, StatCard, EmptyState, Skeleton, rupees, when } from '../components/ui';
import { getUser } from '../utils/auth';

const ACTIVE = ['Searching', 'Confirmed', 'In Progress'];
const POLL_MS = 15000;

const TABS = [
  { id: 'all', label: 'Sabhi', match: () => true },
  { id: 'active', label: 'Active', match: (b) => ACTIVE.includes(b.status) },
  { id: 'completed', label: 'Completed', match: (b) => b.status === 'Completed' },
  { id: 'cancelled', label: 'Cancelled', match: (b) => ['Cancelled', 'No Workers'].includes(b.status) },
];

const canCallFor = (b) =>
  ['Confirmed', 'In Progress'].includes(b.status) || (b.status === 'Completed' && b.paymentStatus !== 'paid');

function BookingCard({ booking, onOpen, onCancel, cancelling, navigate }) {
  const b = booking;
  const worker = b.assignedWorker;
  const unpaid = b.status === 'Completed' && b.paymentStatus !== 'paid';
  const cancellable = ['Searching', 'Confirmed'].includes(b.status) && b.paymentStatus !== 'paid';

  return (
    <li className="card overflow-hidden">
      <button
        type="button"
        onClick={() => onOpen(b._id)}
        className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-slate-50 sm:p-5"
        aria-label={`${b.service} booking, ${b.status}. Open details`}
      >
        <ServiceIcon service={b.service} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{b.service}</h3>
            <StatusChip status={b.status} />
            <PaymentChip booking={b} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{when(b.date, b.time)}</p>
          <p className="mt-0.5 flex items-start gap-1 text-sm text-slate-500">
            <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1 break-words">{b.address}</span>
          </p>
          {worker && (
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
              <BadgeCheck size={14} className="shrink-0 text-primary" aria-hidden="true" />
              {worker.name}
              {worker.rating > 0 && (
                <span className="inline-flex items-center gap-0.5 text-amber-600">
                  <Star size={12} fill="currentColor" aria-hidden="true" /> {Number(worker.rating).toFixed(1)}
                </span>
              )}
            </p>
          )}
          {b.status === 'Searching' && b.workersNotified > 0 && (
            <p className="mt-1 text-xs text-amber-700">{b.workersNotified} workers ko request bheji gayi hai</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-extrabold text-slate-900">{rupees(b.price)}</p>
          <ChevronRight size={18} className="ml-auto mt-2 text-slate-300" aria-hidden="true" />
        </div>
      </button>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        {unpaid && (
          <button type="button" className="btn-secondary !min-h-[40px] !py-2" onClick={() => onOpen(b._id)}>
            <CreditCard size={16} aria-hidden="true" /> Payment karo
          </button>
        )}
        {ACTIVE.includes(b.status) && (
          <button type="button" className="btn-primary !min-h-[40px] !py-2" onClick={() => onOpen(b._id)}>
            Track karo
          </button>
        )}
        {canCallFor(b) && <CallButton bookingId={b._id} className="[&_.btn]:!min-h-[40px] [&_.btn]:!py-2" />}
        {b.status === 'Completed' && (
          <button type="button" className="btn-outline !min-h-[40px] !py-2" onClick={() => navigate(`/review/${b._id}`)}>
            <Star size={16} aria-hidden="true" /> Review do
          </button>
        )}
        {['Completed', 'Cancelled', 'No Workers'].includes(b.status) && (
          <button
            type="button"
            className="btn-outline !min-h-[40px] !py-2"
            onClick={() => navigate(`/booking/${encodeURIComponent(b.service)}`)}
          >
            <RotateCcw size={16} aria-hidden="true" /> Dobara book karo
          </button>
        )}
        {cancellable && (
          <button
            type="button"
            className="btn-danger !min-h-[40px] !py-2 sm:ml-auto"
            onClick={() => onCancel(b)}
            disabled={cancelling === b._id}
          >
            {cancelling === b._id ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
            Cancel
          </button>
        )}
      </div>
    </li>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [bookings, setBookings] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [cancelling, setCancelling] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`/booking/my-bookings/${user.id}`);
      setBookings(res.data.bookings || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Bookings load nahi ho payi. Internet check karo.');
      setBookings((prev) => prev || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Keep the list fresh while something is still moving (a worker accepting, a job starting...)
  const hasActive = useMemo(() => (bookings || []).some((b) => ACTIVE.includes(b.status)), [bookings]);
  useEffect(() => {
    if (!hasActive) return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [hasActive, load]);

  useEffect(() => {
    axios.get('/recommendations/suggested')
      .then((res) => setSuggestions(res.data.recommendations || []))
      .catch(() => {});
  }, []);

  const cancel = async (b) => {
    if (!window.confirm('Booking cancel karna chahte ho?')) return;
    setCancelling(b._id);
    try {
      await axios.put(`/booking/cancel/${b._id}`, {});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancel nahi ho saki.');
    } finally {
      setCancelling('');
    }
  };

  const list = bookings || [];
  const stats = {
    total: list.length,
    active: list.filter((b) => ACTIVE.includes(b.status)).length,
    completed: list.filter((b) => b.status === 'Completed').length,
    spent: list.filter((b) => b.paymentStatus === 'paid').reduce((s, b) => s + (b.paidAmount || b.price || 0), 0),
  };
  const due = list.filter((b) => b.status === 'Completed' && b.paymentStatus !== 'paid');
  const dueTotal = due.reduce((s, b) => s + (b.price || 0), 0);

  const shown = list.filter((TABS.find((t) => t.id === tab) || TABS[0]).match);
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <div className="pb-10">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-900 via-primary to-indigo-700 px-4 pb-20 pt-8 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-white/70">Welcome back</p>
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">Namaste, {firstName || 'there'}</h1>
          </div>
          <button type="button" onClick={() => navigate('/services')} className="btn bg-white text-primary shadow-card hover:bg-primary-50">
            <Plus size={18} aria-hidden="true" /> Nayi booking
          </button>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-12 max-w-5xl space-y-6 px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={ClipboardList} label="Total bookings" value={bookings === null ? '–' : stats.total} />
          <StatCard icon={Hourglass} label="Active" value={bookings === null ? '–' : stats.active} tone="amber" />
          <StatCard icon={CheckCircle2} label="Completed" value={bookings === null ? '–' : stats.completed} tone="green" />
          <StatCard icon={Wallet} label="Total paid" value={bookings === null ? '–' : rupees(stats.spent)} tone="orange" />
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
          </div>
        )}

        {/* Money owed comes first */}
        {due.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-secondary/40 bg-secondary-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 shrink-0 text-secondary-600" size={22} aria-hidden="true" />
              <div>
                <p className="font-bold text-slate-900">
                  {due.length === 1 ? 'Ek booking ka payment baaki hai' : `${due.length} bookings ka payment baaki hai`}
                </p>
                <p className="text-sm text-slate-600">Kul {rupees(dueTotal)}. Online pay karo ya cash worker ko do.</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate(`/track/${due[0]._id}`)} className="btn-secondary">
              Payment karo
            </button>
          </div>
        )}

        {/* Quick rebook */}
        {suggestions.length > 0 && (
          <section aria-label="Suggested services">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              <Sparkles size={15} aria-hidden="true" /> Aapke liye
            </h2>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => navigate(`/booking/${encodeURIComponent(s)}`)}
                  className="card flex shrink-0 items-center gap-3 px-4 py-3 transition hover:shadow-lift"
                >
                  <ServiceIcon service={s} size={36} />
                  <span className="text-sm font-semibold text-slate-800">{s}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Bookings */}
        <section aria-label="My bookings">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">Meri bookings</h2>
            <div role="tablist" aria-label="Filter bookings" className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1 sm:w-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition ${
                    tab === t.id ? 'bg-white text-primary shadow-card' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 text-xs opacity-60">{list.filter(t.match).length}</span>
                </button>
              ))}
            </div>
          </div>

          {bookings === null ? (
            <div className="space-y-3">
              <Skeleton className="h-32" /><Skeleton className="h-32" />
            </div>
          ) : shown.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={CalendarX}
                title={tab === 'all' ? 'Abhi koi booking nahi hai' : 'Is filter mein kuch nahi'}
                text={tab === 'all' ? 'Apni pehli service book karo. Plumber, electrician, cleaner aur bahut kuch.' : 'Dusra filter try karo.'}
              >
                {tab === 'all' && (
                  <button type="button" className="btn-primary" onClick={() => navigate('/services')}>
                    <Plus size={18} aria-hidden="true" /> Service chuno
                  </button>
                )}
              </EmptyState>
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((b) => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  onOpen={(id) => navigate(`/track/${id}`)}
                  onCancel={cancel}
                  cancelling={cancelling}
                  navigate={navigate}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
