import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../utils/axios';
import { SERVICE_ICONS } from '../data/chatKnowledge';

const POLL_MS = 8000;
const ACTIVE = ['Searching', 'Confirmed', 'In Progress'];

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

// The five stages a booking goes through, with the time each one happened
export const buildSteps = (b) => [
  { key: 'requested', icon: '📝', title: 'Request bheji gayi', at: b.createdAt, done: true },
  {
    key: 'assigned',
    icon: '👷',
    title: 'Worker mil gaya',
    at: b.acceptedAt,
    done: !!b.acceptedAt,
    hint: 'Paas ke workers ko request gayi hai. Jo pehle accept karega wo aayega.',
  },
  {
    key: 'onTheWay',
    icon: '🚗',
    title: 'Worker raste mein hai',
    at: b.onTheWayAt,
    done: !!b.onTheWayAt,
  },
  {
    key: 'started',
    icon: '🛠️',
    title: 'Kaam shuru',
    at: b.startedAt,
    done: !!b.startedAt,
    hint: 'Worker ko neeche wala START code batao.',
  },
  {
    key: 'completed',
    icon: '🎉',
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
          <li key={s.key} className="flex gap-4 pb-6 last:pb-0 relative">
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-[19px] top-10 bottom-0 w-0.5 ${s.done ? 'bg-primary' : 'bg-gray-200'}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${
                s.done
                  ? 'bg-primary border-primary text-white'
                  : isCurrent
                    ? 'bg-white border-primary animate-pulse'
                    : 'bg-white border-gray-200 grayscale opacity-60'
              }`}
            >
              {s.done ? '✓' : s.icon}
            </span>
            <div className="min-w-0 pt-1.5">
              <p className={`font-semibold ${s.done || isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>
                {s.title}
              </p>
              {s.done && s.at && <p className="text-xs text-gray-400 mt-0.5">{fmt(s.at)}</p>}
              {isCurrent && s.hint && <p className="text-sm text-gray-500 mt-1">{s.hint}</p>}
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
  return (
    <section
      className={`rounded-2xl p-5 sm:p-6 mb-6 text-center border-2 ${
        isStart ? 'bg-indigo-50 border-primary/30' : 'bg-green-50 border-green-300'
      }`}
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
        {isStart ? '▶️ START code' : '✅ END code'}
      </p>
      <p
        className="text-5xl sm:text-6xl font-extrabold tracking-[0.3em] pl-[0.3em] text-gray-800 my-3"
        aria-label={`Code ${code.split('').join(' ')}`}
      >
        {code}
      </p>
      <p className="text-sm text-gray-600">
        {isStart
          ? 'Jab worker aapke ghar pahunch kar kaam shuru kare, tab use ye code batao.'
          : 'Kaam poora hone aur aapke santusht hone par hi worker ko ye code batao.'}
      </p>
      <p className="text-xs text-gray-400 mt-3">
        🔒 Ye code phone/message par kisi ko mat bhejo. Sirf worker ko, saamne.
      </p>
    </section>
  );
}

function Track() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
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

  // Refresh while the booking is still moving; stop once it is finished
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      const b = await load();
      if (stopped) return;
      if (b && !ACTIVE.includes(b.status)) return;
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

  if (error && !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link to="/dashboard" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">
          Dashboard par jao
        </Link>
      </div>
    );
  }
  if (!booking) {
    return <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">Loading...</div>;
  }

  const worker = booking.assignedWorker;
  const cancelled = booking.status === 'Cancelled';
  const noWorkers = booking.status === 'No Workers';
  const canCancel = ['Searching', 'Confirmed'].includes(booking.status);

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="text-sm text-gray-500 hover:text-primary mb-2 py-2.5 pr-3"
      >
        ← Meri bookings
      </button>

      <header className="flex items-center gap-3 mb-6">
        <span className="text-4xl" aria-hidden="true">{SERVICE_ICONS[booking.service] || '🔧'}</span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">{booking.service}</h1>
          <p className="text-sm text-gray-500">
            {booking.date} · {booking.time} · ID #{String(booking._id).slice(-8).toUpperCase()}
          </p>
        </div>
      </header>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {cancelled && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
          ❌ Ye booking cancel ho gayi{booking.cancelledAt ? ` (${fmt(booking.cancelledAt)})` : ''}.
        </div>
      )}
      {noWorkers && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 p-4 rounded-xl mb-6">
          😔 Is booking ke liye koi worker available nahi tha.
        </div>
      )}

      <OtpCard booking={booking} />

      {!cancelled && !noWorkers && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-5">Progress</h2>
          <Stepper booking={booking} />
          {ACTIVE.includes(booking.status) && (
            <p className="text-xs text-gray-400 mt-5">Ye page khud update hota rehta hai.</p>
          )}
        </section>
      )}

      {worker && !cancelled && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">Aapka worker</h2>
          <div className="flex items-center gap-4">
            {worker.photoUrl ? (
              <img src={worker.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold" aria-hidden="true">
                {worker.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 truncate">{worker.name}</p>
              <p className="text-sm text-gray-500">
                {worker.service}
                {worker.city ? ` · ${worker.city}` : ''}
                {worker.rating ? ` · ⭐ ${Number(worker.rating).toFixed(1)}` : ''}
              </p>
            </div>
            {worker.phone && (
              <a
                href={`tel:${worker.phone}`}
                className="flex-shrink-0 bg-green-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-600 transition"
              >
                📞 Call
              </a>
            )}
          </div>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-3">Booking details</h2>
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-400">📍 Address</dt>
          <dd className="text-gray-700 break-words">{booking.address}</dd>
          {booking.description && (
            <>
              <dt className="text-gray-400">📝 Note</dt>
              <dd className="text-gray-700 break-words">{booking.description}</dd>
            </>
          )}
          <dt className="text-gray-400">💰 Amount</dt>
          <dd className="text-gray-700 font-semibold">₹{booking.price} (cash after work)</dd>
        </dl>
      </section>

      <div className="flex flex-wrap gap-3">
        {canCancel && (
          <button
            onClick={cancel}
            disabled={cancelling}
            className="bg-red-50 text-red-500 border border-red-200 px-5 py-3 rounded-xl font-semibold hover:bg-red-100 transition disabled:opacity-60"
          >
            {cancelling ? '⏳ Cancelling...' : '❌ Booking cancel karo'}
          </button>
        )}
        {booking.status === 'Completed' && (
          <button
            onClick={() => navigate(`/review/${booking._id}`)}
            className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-5 py-3 rounded-xl font-semibold hover:bg-yellow-100 transition"
          >
            ⭐ Review do
          </button>
        )}
        {(cancelled || noWorkers || booking.status === 'Completed') && (
          <button
            onClick={() => navigate(`/booking/${encodeURIComponent(booking.service)}`)}
            className="bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            🔁 Dobara book karo
          </button>
        )}
        {booking.status === 'In Progress' && (
          <p className="text-sm text-gray-500">
            Kaam chal raha hai. Koi dikkat ho to{' '}
            <a href="mailto:support@nipungo.com" className="text-primary underline">support se baat karo</a>.
          </p>
        )}
      </div>
    </div>
  );
}

export default Track;
