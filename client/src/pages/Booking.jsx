import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Plus, CreditCard, Banknote, ShieldCheck,
  Check, Loader2, AlertTriangle, Lock,
} from 'lucide-react';
import axios from '../utils/axios';
import ServiceIcon from '../components/ServiceIcon';
import { getUser } from '../utils/auth';
import { payForBooking } from '../utils/payment';
import {
  slotsFor, upcomingDates, todayIST, addDaysISO, formatDate, istParts, MAX_DAYS_AHEAD,
} from '../utils/slots';
import { SERVICE_PRICES, PLATFORM_FEE } from '../data/chatKnowledge';

const DRAFT_KEY = (service) => `nipungo_booking_draft_${service}`;
const EMPTY_ADDRESS = { label: 'Home', line: '', landmark: '', city: '', pincode: '' };
const LABEL = { Home: 'Home', Work: 'Work', Other: 'Other' };

const loadDraft = (service) => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY(service))) || {};
  } catch {
    return {};
  }
};

function Section({ icon: Icon, title, hint, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
          <Icon size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {hint && <p className="text-sm text-slate-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Booking() {
  const { serviceName } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const basePrice = SERVICE_PRICES[serviceName];
  const total = basePrice === undefined ? null : basePrice + PLATFORM_FEE;

  // What the customer has chosen so far (remembered if they refresh or get interrupted)
  const draft = useMemo(() => loadDraft(serviceName), [serviceName]);
  const [date, setDate] = useState(draft.date || '');
  const [time, setTime] = useState(draft.time || '');
  const [note, setNote] = useState(draft.note || '');
  const [paymentMethod, setPaymentMethod] = useState(draft.paymentMethod === 'online' ? 'online' : 'cash');
  const [addressId, setAddressId] = useState(draft.addressId || '');

  const [addresses, setAddresses] = useState([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [savingAddress, setSavingAddress] = useState(false);

  const [workersAvailable, setWorkersAvailable] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // The clock moves while the page is open: slots that pass disappear on their own
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Saved addresses: the default one is selected automatically
  useEffect(() => {
    let cancelled = false;
    axios.get('/user/addresses')
      .then((res) => {
        if (cancelled) return;
        const list = res.data.addresses || [];
        setAddresses(list);
        setAddressId((current) => {
          if (current && list.some((a) => a._id === current)) return current;
          return (list.find((a) => a.isDefault) || list[0])?._id || '';
        });
        if (list.length === 0) setAdding(true);
      })
      .catch(() => { if (!cancelled) setAdding(true); })
      .finally(() => { if (!cancelled) setAddressesLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    axios.get('/worker/availability')
      .then((res) => { if (!cancelled) setWorkersAvailable(res.data.availability?.[serviceName] || 0); })
      .catch(() => { if (!cancelled) setWorkersAvailable(null); });
    return () => { cancelled = true; };
  }, [serviceName]);

  const dates = useMemo(() => upcomingDates(7, now), [now]);
  const slots = useMemo(() => (date ? slotsFor(date, now) : []), [date, now]);

  // A remembered or previously chosen date/time that has since passed is dropped, not submitted
  useEffect(() => {
    if (date && slotsFor(date, now).length === 0) { setDate(''); setTime(''); return; }
    if (time && date && !slotsFor(date, now).includes(time)) setTime('');
  }, [date, time, now]);

  // Remember the choices for this service (cleared once the booking is made)
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY(serviceName), JSON.stringify({ date, time, note, paymentMethod, addressId }));
    } catch { /* private mode: nothing to remember */ }
  }, [serviceName, date, time, note, paymentMethod, addressId]);

  const chosenAddress = addresses.find((a) => a._id === addressId);
  const ready = !!(date && time && chosenAddress && total !== null);

  const saveNewAddress = useCallback(async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setError('');
    try {
      const res = await axios.post('/user/addresses', newAddress);
      const list = res.data.addresses || [];
      setAddresses(list);
      setAddressId(list[list.length - 1]?._id || '');
      setNewAddress(EMPTY_ADDRESS);
      setAdding(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Address save nahi ho saka.');
    } finally {
      setSavingAddress(false);
    }
  }, [newAddress]);

  const submit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post('/booking/create', {
        service: serviceName,
        date,
        time,
        address: chosenAddress.full,
        description: note.trim(),
        paymentMethod,
      });

      if (!res.data.success) {
        setError(res.data.message || 'Abhi booking nahi ho payi.');
        return;
      }

      const booking = res.data.booking;
      try { sessionStorage.removeItem(DRAFT_KEY(serviceName)); } catch { /* ignore */ }

      // "Pay now": open the payment window. If they close it, the booking is still made
      // and they can pay from the tracking page (or after the service).
      if (paymentMethod === 'online') {
        await payForBooking(booking._id, user || {});
      }
      navigate(`/track/${booking._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Kuch galat hua! Dobara try karo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (total === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto mb-4 text-amber-500" size={40} aria-hidden="true" />
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Ye service nahi mili</h1>
        <p className="mb-6 text-slate-500">Hamari services ki list dekho aur wahan se chuno.</p>
        <Link to="/services" className="btn-primary">Services dekho</Link>
      </div>
    );
  }

  const today = todayIST(now);
  const clock = istParts(now);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <button
        onClick={() => navigate('/services')}
        className="mb-4 inline-flex min-h-[44px] items-center gap-1.5 pr-3 text-sm font-medium text-slate-500 hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Services
      </button>

      <header className="mb-6 flex items-center gap-4">
        <ServiceIcon service={serviceName} size={56} />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Book {serviceName}</h1>
          <p className="text-slate-500">Date aur time chuno, baaki hum sambhal lenge.</p>
        </div>
      </header>

      {workersAvailable === 0 && (
        <div role="status" className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Abhi <strong>{serviceName}</strong> ka koi worker available nahi hai. Aap try kar sakte ho, par worker
            milne ki guarantee nahi hai. Thodi der baad dobara aana ya koi aur service dekho.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {/* ── When ── */}
          <Section icon={CalendarDays} title="Kab chahiye?" hint={`Aaj ${clock.hour % 12 || 12}:${String(clock.minute).padStart(2, '0')} ${clock.hour >= 12 ? 'PM' : 'AM'} (India time)`}>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label="Date">
              {dates.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  role="radio"
                  aria-checked={date === d.iso}
                  onClick={() => { setDate(d.iso); setTime(''); setError(''); }}
                  className={`flex min-h-[64px] min-w-[76px] shrink-0 flex-col items-center justify-center rounded-xl border-2 px-3 py-2 text-center transition ${
                    date === d.iso
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200'
                  }`}
                >
                  <span className="text-sm font-bold">{d.label}</span>
                  <span className="text-xs opacity-80">{d.sub}</span>
                </button>
              ))}
            </div>

            <label className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              Ya koi aur din:
              <input
                type="date"
                aria-label="Pick another date"
                min={today}
                max={addDaysISO(today, MAX_DAYS_AHEAD)}
                value={date}
                onChange={(e) => { setDate(e.target.value); setTime(''); setError(''); }}
                className="input w-auto"
              />
            </label>

            {date && (
              <div className="mt-5">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Clock size={15} aria-hidden="true" /> {formatDate(date)}: time chuno
                </h3>
                {slots.length === 0 ? (
                  <p className="text-sm text-amber-700">Is din koi slot nahi bacha. Dusra din chuno.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Time slot">
                    {slots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={time === s}
                        onClick={() => { setTime(s); setError(''); }}
                        className={`min-h-[44px] whitespace-nowrap rounded-xl border-2 px-2 py-2 text-sm font-semibold transition ${
                          time === s
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ── Where ── */}
          <Section icon={MapPin} title="Kahan aana hai?" hint="Saved address ek tap mein. Naya address ek baar save karo, hamesha ke liye.">
            {!addressesLoaded ? (
              <p className="text-sm text-slate-400">Addresses load ho rahe hain...</p>
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className="grid gap-3" role="radiogroup" aria-label="Address">
                    {addresses.map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        role="radio"
                        aria-checked={addressId === a._id}
                        onClick={() => { setAddressId(a._id); setError(''); }}
                        className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                          addressId === a._id ? 'border-primary bg-primary-50' : 'border-slate-200 bg-white hover:border-primary-200'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            addressId === a._id ? 'border-primary bg-primary text-white' : 'border-slate-300'
                          }`}
                          aria-hidden="true"
                        >
                          {addressId === a._id && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-semibold text-slate-900">
                            {LABEL[a.label] || a.label}
                            {a.isDefault && <span className="chip bg-primary-100 text-primary-700">Default</span>}
                          </span>
                          <span className="block break-words text-sm text-slate-600">{a.full}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!adding && addresses.length < 5 && (
                  <button type="button" onClick={() => setAdding(true)} className="btn-outline mt-3 w-full border-dashed">
                    <Plus size={16} aria-hidden="true" /> Naya address add karo
                  </button>
                )}

                {adding && (
                  <form onSubmit={saveNewAddress} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex gap-2" role="group" aria-label="Address type">
                      {['Home', 'Work', 'Other'].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setNewAddress({ ...newAddress, label: l })}
                          className={`min-h-[44px] flex-1 rounded-xl border-2 text-sm font-semibold ${
                            newAddress.label === l ? 'border-primary bg-primary-50 text-primary' : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    <input className="input" placeholder="Ghar / flat no., building, area" required maxLength={150}
                      value={newAddress.line} onChange={(e) => setNewAddress({ ...newAddress, line: e.target.value })} />
                    <input className="input" placeholder="Landmark (optional)" maxLength={80}
                      value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className="input" placeholder="City" required maxLength={50}
                        value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                      <input className="input" placeholder="Pincode (6 digit)" required inputMode="numeric"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
                    </div>
                    <div className="flex gap-3">
                      {addresses.length > 0 && (
                        <button type="button" className="btn-outline flex-1" onClick={() => { setAdding(false); setNewAddress(EMPTY_ADDRESS); }}>
                          Cancel
                        </button>
                      )}
                      <button type="submit" className="btn-primary flex-1" disabled={savingAddress}>
                        {savingAddress ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                        Save address
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </Section>

          {/* ── Note ── */}
          <section className="card p-5 sm:p-6">
            <label htmlFor="booking-note" className="mb-1 block text-lg font-bold text-slate-900">
              Koi extra detail? <span className="text-sm font-normal text-slate-400">(optional)</span>
            </label>
            <p className="mb-3 text-sm text-slate-500">Worker ko problem batao, jaise "bathroom ka nal tapak raha hai".</p>
            <textarea
              id="booking-note"
              rows={3}
              maxLength={300}
              className="input resize-none"
              placeholder="Kya problem hai?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{note.length}/300</p>
          </section>

          {/* ── Payment ── */}
          <Section icon={CreditCard} title="Payment kaise karoge?" hint="Dono mein se kuch bhi chuno. Kaam ke baad bhi badal sakte ho.">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {[
                { id: 'cash', Icon: Banknote, title: 'Kaam ke baad pay karo', sub: 'Cash worker ko do, ya UPI / card se yahin pay karo.', tag: 'Recommended' },
                { id: 'online', Icon: CreditCard, title: 'Abhi online pay karo', sub: 'UPI, card ya netbanking se turant.' },
              ].map(({ id, Icon, title, sub, tag }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === id}
                  onClick={() => setPaymentMethod(id)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                    paymentMethod === id ? 'border-primary bg-primary-50' : 'border-slate-200 bg-white hover:border-primary-200'
                  }`}
                >
                  <Icon size={22} className={paymentMethod === id ? 'text-primary' : 'text-slate-400'} aria-hidden="true" />
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-slate-900">
                      {title}
                      {tag && <span className="chip bg-emerald-100 text-emerald-700">{tag}</span>}
                    </span>
                    <span className="block text-sm text-slate-500">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Summary ── */}
        <aside className="card min-w-0 p-5 sm:p-6 lg:sticky lg:top-24" aria-label="Booking summary">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Booking summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Service</dt>
              <dd className="font-semibold text-slate-900">{serviceName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Date</dt>
              <dd className="font-semibold text-slate-900">{date ? formatDate(date) : <span className="font-normal text-slate-400">Chuno</span>}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Time</dt>
              <dd className="font-semibold text-slate-900">{time || <span className="font-normal text-slate-400">Chuno</span>}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-slate-500">Address</dt>
              <dd className="break-words text-right font-semibold text-slate-900">
                {chosenAddress ? chosenAddress.full : <span className="font-normal text-slate-400">Chuno</span>}
              </dd>
            </div>
          </dl>

          <div className="my-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-600"><span>Service charge</span><span>₹{basePrice}</span></div>
            <div className="flex justify-between text-slate-600"><span>Platform fee</span><span>₹{PLATFORM_FEE}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold text-slate-900">
              <span>Total</span><span>₹{total}</span>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
            </div>
          )}

          <button type="button" onClick={submit} disabled={!ready || submitting} className="btn-primary w-full py-3.5 text-base">
            {submitting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <ShieldCheck size={18} aria-hidden="true" />}
            {submitting ? 'Booking ho rahi hai...' : paymentMethod === 'online' ? `Confirm & pay ₹${total}` : 'Confirm booking'}
          </button>
          {!ready && !submitting && (
            <p className="mt-2 text-center text-xs text-slate-400">
              {!date ? 'Pehle date chuno' : !time ? 'Ab time chuno' : 'Address chuno'}
            </p>
          )}

          <ul className="mt-5 space-y-2 text-xs text-slate-500">
            <li className="flex gap-2"><Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> Aapka number worker ko tabhi dikhta hai jab aap Call karo dabate ho.</li>
            <li className="flex gap-2"><ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> Kaam 4-digit code se shuru aur khatam hota hai.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

export default Booking;
