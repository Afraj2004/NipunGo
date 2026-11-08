import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileText, BadgeCheck, Truck, Wrench, Flag, Check, Play, CheckCircle2, Lock,
  Banknote, CreditCard, Star, RotateCcw, XCircle, Search, Loader2, AlertTriangle, MapPin, Receipt,
} from 'lucide-react';
import axios from '../utils/axios';
import ServiceIcon from '../components/ServiceIcon';
import { getUser } from '../utils/auth';
import { payForBooking } from '../utils/payment';

const POLL_MS = 8000;
const ACTIVE = ['Searching', 'Confirmed', 'In Progress'];

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

// The five stages a booking goes through, with the time each one happened
export const buildSteps = (b) => [
  { key: 'requested', Icon: FileText, title: 'Request bheji gayi', at: b.createdAt, done: true },
  {
    key: 'assigned',
    Icon: BadgeCheck,
    title: 'Worker mil gaya',
    at: b.acceptedAt,
    done: !!b.acceptedAt,
    hint: 'Paas ke workers ko request gayi hai. Jo pehle accept karega wo aayega.',
  },
  {
    key: 'onTheWay',
    Icon: Truck,
    title: 'Worker raste mein hai',
    at: b.onTheWayAt,
    // if work has started, the worker obviously arrived, even if they never tapped "on the way"
    done: !!b.onTheWayAt || !!b.startedAt,
  },
  {
    key: 'started',
    Icon: Wrench,
    title: 'Kaam shuru',
    at: b.startedAt,
    done: !!b.startedAt,
    hint: 'Worker ko neeche wala START code batao.',
  },
  {
    key: 'completed',
    Icon: Flag,
    title: 'Kaam complete',
    at: b.completedAt,
    done: !!b.completedAt,
    hint: 'Kaam poora hone par worker ko END code batao.',
  },
];

function Stepper({ booking }) {
  const steps = buildSteps(booking);
  const current = steps.findIndex((s) => !s.done); // first stage not reached yet
  return (
    <ol className="relative" aria-label="Booking progress">
      {steps.map((s, i) => {
        const isCurrent = i === current;
        return (
          <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-[19px] top-10 bottom-0 w-0.5 ${s.done ? 'bg-primary' : 'bg-slate-200'}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                s.done
                  ? 'border-primary bg-primary text-white'
                  : isCurrent
                    ? 'animate-pulse border-primary bg-white text-primary'
                    : 'border-slate-200 bg-white text-slate-300'
              }`}
            >
              {s.done ? <Check size={18} strokeWidth={3} /> : <s.Icon size={18} />}
            </span>
            <div className="min-w-0 pt-1.5">
              <p className={`font-semibold ${s.done || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>{s.title}</p>
              {s.done && s.at && <p className="mt-0.5 text-xs text-slate-400">{fmt(s.at)}</p>}
              {isCurrent && s.hint && <p className="mt-1 text-sm text-slate-500">{s.hint}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// The 4-digit code the customer reads out to the worker
function OtpCard({ booking }) {
  const start = booking.otps?.start;
  const end = booking.otps?.end;
  const code = start || end;
  if (!code) return null;
  const isStart = !!start;
  const Icon = isStart ? Play : CheckCircle2;
  return (
    <section
      className={`mb-6 rounded-2xl border-2 p-5 text-center sm:p-6 ${
        isStart ? 'border-primary/30 bg-primary-50' : 'border-emerald-300 bg-emerald-50'
      }`}
      aria-live="polite"
    >
      <p className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600">
        <Icon size={16} aria-hidden="true" /> {isStart ? 'START code' : 'END code'}
      </p>
      <p
        className="my-3 pl-[0.3em] text-5xl font-extrabold tracking-[0.3em] text-slate-900 sm:text-6xl"
        aria-label={`Code ${code.split('').join(' ')}`}
      >
        {code}
      </p>
      <p className="text-sm text-slate-600">
        {isStart
          ? 'Jab worker aapke ghar pahunch kar kaam shuru kare, tab use ye code batao.'
          : 'Kaam poora hone aur aapke santusht hone par hi worker ko ye code batao.'}
      </p>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <Lock size={12} aria-hidden="true" /> Ye code phone/message par kisi ko mat bhejo. Sirf worker ko, saamne.
      </p>
    </section>
  );
}

// Payment: shows what is owed, lets the customer pay online, and explains the cash route.
function PaymentCard({ booking, onPay, paying, payMessage }) {
  if (['Cancelled', 'No Workers'].includes(booking.status)) return null;

  if (booking.paymentStatus === 'paid') {
    return (
      <section className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <Receipt className="mt-0.5 shrink-0 text-emerald-600" size={22} aria-hidden="true" />
        <div>
          <p className="font-bold text-emerald-800">Payment ho gaya: ₹{booking.paidAmount || booking.price}</p>
          <p className="text-sm text-emerald-700">
            {booking.paidVia === 'cash' ? 'Cash se' : 'Online'} {booking.paidAt ? `· ${fmt(booking.paidAt)}` : ''}
          </p>
        </div>
      </section>
    );
  }

  const due = booking.status === 'Completed';
  return (
    <section
      className={`mb-6 rounded-2xl border-2 p-5 sm:p-6 ${due ? 'border-secondary/40 bg-secondary-50' : 'border-slate-200 bg-white'}`}
      aria-label="Payment"
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{due ? 'Payment baaki hai' : 'Payment'}</h2>
        <span className="text-2xl font-extrabold text-slate-900">₹{booking.price}</span>
      </div>
      <p className="mb-4 text-sm text-slate-600">
        {due
          ? 'Kaam ho gaya. Neeche se online pay karo, ya cash worker ko do.'
          : 'Payment kaam poora hone ke baad hota hai. Chaho to abhi bhi online pay kar sakte ho.'}
      </p>

      {payMessage && (
        <p role="alert" className="mb-3 flex gap-2 text-sm text-red-600">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {payMessage}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onPay} disabled={paying} className={due ? 'btn-secondary' : 'btn-outline'}>
          {paying ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <CreditCard size={16} aria-hidden="true" />}
          {paying ? 'Payment khul raha hai...' : `Online pay karo (UPI / card)`}
        </button>
        <div className="flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-600">
          <Banknote size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>
            <strong className="text-slate-800">Cash?</strong> Worker ko ₹{booking.price} do. Woh confirm karenge to yahan
            "Paid" dikh jayega.
          </span>
        </div>
      </div>
    </section>
  );
}

function Track() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payMessage, setPayMessage] = useState('');
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`/booking/single/${bookingId}`);
      setBooking(res.data.booking);
      setError('');
      return res.data.booking;
    } catch (err) {
      setError(
        err.response?.status === 403 || err.response?.status === 404
          ? 'Ye booking nahi mili ya aapki nahi hai.'
          : 'Booking load nahi ho payi. Internet check karo.'
      );
      return null;
    }
  }, [bookingId]);

  // Refresh while the booking is still moving (or money is still owed); stop once everything is settled
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      const b = await load();
      if (stopped) return;
      const settled = b && !ACTIVE.includes(b.status) && (b.paymentStatus === 'paid' || ['Cancelled', 'No Workers'].includes(b.status));
      if (settled) return;
      timer.current = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer.current);
    };
  }, [load]);

  const cancel = async () => {
    if (!window.confirm('Booking cancel karna chahte ho?')) return;
    setCancelling(true);
    try {
      await axios.put(`/booking/cancel/${bookingId}`, {});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancel nahi ho saki.');
    } finally {
      setCancelling(false);
    }
  };

  const pay = async () => {
    setPaying(true);
    setPayMessage('');
    const result = await payForBooking(bookingId, getUser() || {});
    if (result.status === 'failed') setPayMessage(result.message);
    await load();
    setPaying(false);
  };

  if (error && !booking) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Search className="mx-auto mb-4 text-slate-300" size={44} aria-hidden="true" />
        <p className="mb-6 text-slate-600">{error}</p>
        <Link to="/dashboard" className="btn-primary">Dashboard par jao</Link>
      </div>
    );
  }
  if (!booking) {
    return <div className="mx-auto max-w-xl px-4 py-16 text-center text-slate-400">Loading...</div>;
  }

  const worker = booking.assignedWorker;
  const cancelled = booking.status === 'Cancelled';
  const noWorkers = booking.status === 'No Workers';
  const canCancel = ['Searching', 'Confirmed'].includes(booking.status) && booking.paymentStatus !== 'paid';

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-2 inline-flex min-h-[44px] items-center gap-1.5 pr-3 text-sm font-medium text-slate-500 hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Meri bookings
      </button>

      <header className="mb-6 flex items-center gap-4">
        <ServiceIcon service={booking.service} size={52} />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{booking.service}</h1>
          <p className="text-sm text-slate-500">
            {booking.date} · {booking.time} · ID #{String(booking._id).slice(-8).toUpperCase()}
          </p>
        </div>
      </header>

      {error && (
        <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      {cancelled && (
        <div className="mb-6 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <XCircle size={20} className="shrink-0" aria-hidden="true" />
          Ye booking cancel ho gayi{booking.cancelledAt ? ` (${fmt(booking.cancelledAt)})` : ''}.
        </div>
      )}
      {noWorkers && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
          Is booking ke liye koi worker available nahi tha.
        </div>
      )}

      <OtpCard booking={booking} />

      {/* After the service, the bill comes before everything else */}
      {booking.status === 'Completed' && (
        <PaymentCard booking={booking} onPay={pay} paying={paying} payMessage={payMessage} />
      )}

      {!cancelled && !noWorkers && (
        <section className="card mb-6 p-5 sm:p-6">
          <h2 className="mb-5 font-bold text-slate-900">Progress</h2>
          <Stepper booking={booking} />
          {ACTIVE.includes(booking.status) && (
            <p className="mt-5 text-xs text-slate-400">Ye page khud update hota rehta hai.</p>
          )}
        </section>
      )}

      {worker && !cancelled && (
        <section className="card mb-6 p-5 sm:p-6">
          <h2 className="mb-4 font-bold text-slate-900">Aapka worker</h2>
          <div className="flex items-center gap-4">
            {worker.photoUrl ? (
              <img src={worker.photoUrl} alt="" className="h-16 w-16 rounded-full border-2 border-primary object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white" aria-hidden="true">
                {worker.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{worker.name}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
                <span>{worker.service}{worker.city ? ` · ${worker.city}` : ''}</span>
                {worker.rating ? (
                  <span className="inline-flex items-center gap-0.5 text-amber-600">
                    <Star size={13} fill="currentColor" aria-hidden="true" /> {Number(worker.rating).toFixed(1)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Aapki privacy ke liye phone numbers share nahi hote. Kaam ka sab update yahin milega.
          </p>
        </section>
      )}

      <section className="card mb-6 p-5 sm:p-6">
        <h2 className="mb-3 font-bold text-slate-900">Booking details</h2>
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="flex items-center gap-1.5 text-slate-400"><MapPin size={14} aria-hidden="true" /> Address</dt>
          <dd className="break-words text-slate-700">{booking.address}</dd>
          {booking.description && (
            <>
              <dt className="flex items-center gap-1.5 text-slate-400"><FileText size={14} aria-hidden="true" /> Note</dt>
              <dd className="break-words text-slate-700">{booking.description}</dd>
            </>
          )}
          <dt className="flex items-center gap-1.5 text-slate-400"><Banknote size={14} aria-hidden="true" /> Amount</dt>
          <dd className="font-semibold text-slate-700">₹{booking.price}</dd>
        </dl>
      </section>

      {/* Before the service the payment card is secondary */}
      {booking.status !== 'Completed' && (
        <PaymentCard booking={booking} onPay={pay} paying={paying} payMessage={payMessage} />
      )}

      <div className="flex flex-wrap gap-3">
        {canCancel && (
          <button onClick={cancel} disabled={cancelling} className="btn-danger">
            {cancelling ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
            {cancelling ? 'Cancelling...' : 'Booking cancel karo'}
          </button>
        )}
        {booking.status === 'Completed' && (
          <button onClick={() => navigate(`/review/${booking._id}`)} className="btn-outline">
            <Star size={16} aria-hidden="true" /> Review do
          </button>
        )}
        {(cancelled || noWorkers || booking.status === 'Completed') && (
          <button onClick={() => navigate(`/booking/${encodeURIComponent(booking.service)}`)} className="btn-primary">
            <RotateCcw size={16} aria-hidden="true" /> Dobara book karo
          </button>
        )}
        {booking.status === 'In Progress' && (
          <p className="text-sm text-slate-500">
            Kaam chal raha hai. Koi dikkat ho to{' '}
            <a href="mailto:support@nipungo.com" className="text-primary underline">support se baat karo</a>.
          </p>
        )}
        {booking.paymentStatus === 'paid' && booking.status !== 'Completed' && !cancelled && (
          <p className="text-sm text-slate-500">
            Payment ho chuka hai. Cancel / refund ke liye{' '}
            <a href="mailto:support@nipungo.com" className="text-primary underline">support</a> se baat karo.
          </p>
        )}
      </div>
    </div>
  );
}

export default Track;
