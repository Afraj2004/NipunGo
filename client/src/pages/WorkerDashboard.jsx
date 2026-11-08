import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, Briefcase, CheckCircle2, Wallet, Banknote, MapPin, Clock, FileText, Truck, Play, Flag,
  Check, X, Loader2, Camera, Trash2, AlertTriangle, Inbox, User, Power, ShieldCheck,
} from 'lucide-react';
import axios from '../utils/axios';
import OtpInput from '../components/OtpInput';
import ServiceIcon from '../components/ServiceIcon';
import CallButton from '../components/CallButton';
import { StatusChip, PaymentChip, StatCard, EmptyState, Skeleton, rupees, when } from '../components/ui';
import { getUser } from '../utils/auth';
import { SERVICE_PRICES } from '../data/chatKnowledge';

const REQUEST_POLL_MS = 10000;
const JOB_POLL_MS = 30000;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const canCall = (b) =>
  ['Confirmed', 'In Progress'].includes(b.status) || (b.status === 'Completed' && b.paymentStatus !== 'paid');

function Message({ kind, children }) {
  if (!children) return null;
  const style = kind === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${style}`}>
      {kind === 'error' ? <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}
      {children}
    </div>
  );
}

function Detail({ icon: Icon, children }) {
  return (
    <p className="flex items-start gap-2 text-sm text-slate-600">
      <Icon size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function WorkerDashboard() {
  const user = getUser();
  const userId = user?.id;

  const [tab, setTab] = useState('requests'); // requests | jobs | profile
  const [requests, setRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState({ kind: '', text: '' });

  // start / finish dialog
  const [otpModal, setOtpModal] = useState(null); // { booking, kind: 'start' | 'end' }
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);

  // profile form
  const [form, setForm] = useState({ service: '', city: '', experience: '', about: '' });
  const [formMsg, setFormMsg] = useState({ kind: '', text: '' });
  const [savingForm, setSavingForm] = useState(false);
  const [photoMsg, setPhotoMsg] = useState({ kind: '', text: '' });
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(`/booking/worker-requests/${userId}`);
      if (res.data.success) setRequests(res.data.requests);
    } catch { /* keep what we have; the next poll retries */ }
  }, [userId]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await axios.get(`/booking/worker-bookings/${userId}`);
      if (res.data.success) setMyBookings(res.data.bookings);
    } catch { /* same */ }
  }, [userId]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`/worker/${userId}`);
      if (res.data.success) {
        const w = res.data.worker;
        setProfile(w);
        setIsAvailable(w.isAvailable ?? true);
        setForm({
          service: w.service || '',
          city: w.city || '',
          experience: w.experience || '',
          about: w.about || '',
        });
      }
    } catch { /* ignore */ }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    Promise.all([fetchRequests(), fetchJobs(), fetchProfile()]).finally(() => setLoaded(true));
    const r = setInterval(fetchRequests, REQUEST_POLL_MS);
    const j = setInterval(fetchJobs, JOB_POLL_MS);
    return () => { clearInterval(r); clearInterval(j); };
  }, [userId, fetchRequests, fetchJobs, fetchProfile]);

  // ── actions on requests ──
  const accept = async (id) => {
    setBusy(`${id}_accept`);
    setNotice({ kind: '', text: '' });
    try {
      const res = await axios.put(`/booking/accept/${id}`, {});
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setMyBookings((prev) => [res.data.booking, ...prev]);
      setTab('jobs');
    } catch (err) {
      setNotice({ kind: 'error', text: err.response?.data?.message || 'Accept nahi ho paya.' });
      fetchRequests();
    } finally {
      setBusy('');
    }
  };

  const reject = async (id) => {
    if (!window.confirm('Is request ko reject karna chahte ho?')) return;
    setBusy(`${id}_reject`);
    try {
      await axios.put(`/booking/reject/${id}`, {});
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setNotice({ kind: 'error', text: err.response?.data?.message || 'Kuch galat hua!' });
      fetchRequests();
    } finally {
      setBusy('');
    }
  };

  // ── actions on jobs ──
  const onTheWay = async (id) => {
    setBusy(`${id}_way`);
    try {
      const res = await axios.put(`/booking/on-the-way/${id}`, {});
      setMyBookings((prev) => prev.map((b) => (b._id === id ? { ...b, onTheWayAt: res.data.booking.onTheWayAt } : b)));
    } catch (err) {
      setNotice({ kind: 'error', text: err.response?.data?.message || 'Kuch galat hua!' });
    } finally {
      setBusy('');
    }
  };

  const cashReceived = async (id) => {
    if (!window.confirm('Customer se cash mil gaya? Ye record ho jayega.')) return;
    setBusy(`${id}_cash`);
    try {
      const res = await axios.put(`/booking/cash-received/${id}`, {});
      const p = res.data.booking;
      setMyBookings((prev) => prev.map((b) => (b._id === id
        ? { ...b, paymentStatus: p.paymentStatus, paidVia: p.paidVia, paidAmount: p.paidAmount, paidAt: p.paidAt }
        : b)));
    } catch (err) {
      setNotice({ kind: 'error', text: err.response?.data?.message || 'Kuch galat hua!' });
      fetchJobs(); // e.g. the customer already paid online: show the true state
    } finally {
      setBusy('');
    }
  };

  const openOtp = (booking, kind) => { setOtpModal({ booking, kind }); setOtpValue(''); setOtpError(''); };
  const closeOtp = () => { setOtpModal(null); setOtpValue(''); setOtpError(''); };

  const submitOtp = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 4) { setOtpError('4 digit ka code daalo!'); return; }
    const { booking, kind } = otpModal;
    setOtpBusy(true);
    setOtpError('');
    try {
      const res = await axios.post(`/booking/${kind}/${booking._id}`, { otp: otpValue });
      const done = res.data.booking;
      setMyBookings((prev) => prev.map((b) => (b._id === booking._id
        ? { ...b, status: done.status, startedAt: done.startedAt, completedAt: done.completedAt }
        : b)));
      closeOtp();
      if (kind === 'end') {
        setNotice({ kind: 'ok', text: 'Bahut badhiya! Kaam complete ho gaya. Ab payment collect karo.' });
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Kuch galat hua!');
      setOtpValue('');
    } finally {
      setOtpBusy(false);
    }
  };

  // ── availability ──
  const toggleAvailability = async () => {
    const next = !isAvailable;
    setIsAvailable(next);
    try {
      await axios.put(`/worker/availability/${userId}`, { isAvailable: next });
    } catch (err) {
      setIsAvailable(!next);
      setNotice({ kind: 'error', text: err.response?.data?.message || 'Availability badal nahi payi.' });
    }
  };

  // ── profile ──
  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingForm(true);
    setFormMsg({ kind: '', text: '' });
    try {
      const { service, city, experience, about } = form; // price is set by the platform, not here
      const res = await axios.put(`/worker/update/${userId}`, { service, city, experience, about });
      if (res.data.worker) setProfile(res.data.worker);
      setFormMsg({ kind: 'ok', text: 'Profile save ho gaya!' });
    } catch (err) {
      setFormMsg({ kind: 'error', text: err.response?.data?.message || 'Profile save nahi hua.' });
    } finally {
      setSavingForm(false);
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
      return setPhotoMsg({ kind: 'error', text: 'Sirf JPG, PNG ya WEBP photo chalegi.' });
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return setPhotoMsg({ kind: 'error', text: 'Photo 5MB se chhoti honi chahiye.' });
    }
    setPhotoBusy(true);
    setPhotoMsg({ kind: '', text: '' });
    try {
      const data = new FormData();
      data.append('photo', file);
      const res = await axios.put(`/worker/upload-photo/${userId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile((p) => ({ ...p, photoUrl: res.data.photoUrl || res.data.worker?.photoUrl }));
      setPhotoMsg({ kind: 'ok', text: 'Photo update ho gayi!' });
    } catch (err) {
      setPhotoMsg({ kind: 'error', text: err.response?.data?.message || 'Photo upload nahi ho payi.' });
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!window.confirm('Photo hata dein?')) return;
    setPhotoBusy(true);
    setPhotoMsg({ kind: '', text: '' });
    try {
      await axios.delete(`/worker/delete-photo/${userId}`);
      setProfile((p) => ({ ...p, photoUrl: '' }));
      setPhotoMsg({ kind: 'ok', text: 'Photo hata di gayi.' });
    } catch (err) {
      setPhotoMsg({ kind: 'error', text: err.response?.data?.message || 'Photo hata nahi payi.' });
    } finally {
      setPhotoBusy(false);
    }
  };

  const active = myBookings.filter((b) => ['Confirmed', 'In Progress'].includes(b.status));
  const completed = myBookings.filter((b) => b.status === 'Completed');
  const earned = completed.filter((b) => b.paymentStatus === 'paid').reduce((s, b) => s + (b.paidAmount || b.price || 0), 0);
  const toCollect = completed.filter((b) => b.paymentStatus !== 'paid').reduce((s, b) => s + (b.price || 0), 0);

  const tabs = [
    { id: 'requests', label: 'New Requests', count: requests.length },
    { id: 'jobs', label: 'My Bookings', count: myBookings.length },
    { id: 'profile', label: 'My Profile' },
  ];

  return (
    <div className="pb-10">
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 px-4 pb-20 pt-8 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="" className="h-14 w-14 rounded-full border-2 border-white/40 object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-xl font-bold ring-2 ring-white/30" aria-hidden="true">
                {(user?.name || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight">{user?.name}</h1>
              <p className="truncate text-sm text-white/70">{profile?.service || 'Service chuno'}{profile?.city ? ` · ${profile.city}` : ''}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleAvailability}
            aria-pressed={isAvailable}
            className={`btn ${isAvailable ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white/15 text-white hover:bg-white/25'}`}
          >
            <Power size={16} aria-hidden="true" /> {isAvailable ? 'Available' : 'Unavailable'}
          </button>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-12 max-w-5xl space-y-6 px-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Bell} label="New requests" value={requests.length} tone="amber" />
          <StatCard icon={Briefcase} label="Active jobs" value={active.length} />
          <StatCard icon={CheckCircle2} label="Completed" value={completed.length} tone="green" />
          <StatCard icon={Wallet} label="Earned" value={rupees(earned)} tone="orange" hint={toCollect > 0 ? `${rupees(toCollect)} to collect` : undefined} />
        </div>

        {!isAvailable && (
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-600">
            <Power size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            Aap abhi unavailable ho, isliye nayi requests nahi aayengi. Upar se Available karo.
          </div>
        )}

        <Message kind={notice.kind === 'error' ? 'error' : 'ok'}>{notice.text}</Message>

        <div className="card overflow-hidden">
          <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 overflow-x-auto border-b border-slate-100 p-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-semibold transition ${
                  tab === t.id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
                {t.count !== undefined && <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">{t.count}</span>}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5">
            {!loaded && <div className="space-y-3"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>}

            {/* ── New requests ── */}
            {loaded && tab === 'requests' && (
              requests.length === 0 ? (
                <EmptyState icon={Inbox} title="Abhi koi nayi request nahi" text="Nayi request aate hi yahan dikhegi. Page khud update hota rehta hai." />
              ) : (
                <ul className="space-y-4">
                  {requests.map((r) => (
                    <li key={r._id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <ServiceIcon service={r.service} size={48} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{r.service}</h3>
                            <span className="text-xl font-extrabold text-slate-900">{rupees(r.price)}</span>
                          </div>
                          <p className="text-sm text-slate-500">Customer: {r.customer?.name}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Detail icon={Clock}>{when(r.date, r.time)}</Detail>
                        <Detail icon={MapPin}>{r.address}</Detail>
                        {r.description && <Detail icon={FileText}>{r.description}</Detail>}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button type="button" className="btn-primary" onClick={() => accept(r._id)} disabled={busy === `${r._id}_accept`}>
                          {busy === `${r._id}_accept` ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                          Accept karo
                        </button>
                        <button type="button" className="btn-outline" onClick={() => reject(r._id)} disabled={busy === `${r._id}_reject`}>
                          <X size={16} aria-hidden="true" /> Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}

            {/* ── My bookings / jobs ── */}
            {loaded && tab === 'jobs' && (
              myBookings.length === 0 ? (
                <EmptyState icon={Briefcase} title="Abhi koi booking nahi" text="Jo requests aap accept karoge wo yahan dikhengi." />
              ) : (
                <ul className="space-y-4">
                  {myBookings.map((b) => (
                    <li key={b._id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <ServiceIcon service={b.service} size={48} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{b.service}</h3>
                            <StatusChip status={b.status} />
                            <PaymentChip booking={b} />
                          </div>
                          <p className="text-sm text-slate-500">{b.customer?.name} · ID #{String(b._id).slice(-6).toUpperCase()}</p>
                        </div>
                        <span className="text-lg font-extrabold text-slate-900">{rupees(b.price)}</span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Detail icon={Clock}>{when(b.date, b.time)}</Detail>
                        <Detail icon={MapPin}>{b.address}</Detail>
                        {b.description && <Detail icon={FileText}>{b.description}</Detail>}
                      </div>

                      <div className="mt-4 flex flex-wrap items-start gap-3">
                        {b.status === 'Confirmed' && (
                          <>
                            {!b.onTheWayAt ? (
                              <button type="button" className="btn-outline" onClick={() => onTheWay(b._id)} disabled={busy === `${b._id}_way`}>
                                {busy === `${b._id}_way` ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Truck size={16} aria-hidden="true" />}
                                On the way
                              </button>
                            ) : (
                              <span className="chip bg-blue-50 px-3 py-2 text-blue-700"><Truck size={14} aria-hidden="true" /> Customer ko bata diya</span>
                            )}
                            <button type="button" className="btn-primary" onClick={() => openOtp(b, 'start')}>
                              <Play size={16} aria-hidden="true" /> Start service
                            </button>
                          </>
                        )}
                        {b.status === 'In Progress' && (
                          <button type="button" className="btn bg-emerald-600 text-white shadow-card hover:bg-emerald-700" onClick={() => openOtp(b, 'end')}>
                            <Flag size={16} aria-hidden="true" /> Finish service
                          </button>
                        )}
                        {b.status === 'Completed' && b.paymentStatus !== 'paid' && (
                          <button type="button" className="btn-secondary" onClick={() => cashReceived(b._id)} disabled={busy === `${b._id}_cash`}>
                            {busy === `${b._id}_cash` ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Banknote size={16} aria-hidden="true" />}
                            {rupees(b.price)} cash mil gaya
                          </button>
                        )}
                        {canCall(b) && <CallButton bookingId={b._id} />}
                      </div>

                      {b.status === 'Completed' && b.paymentStatus !== 'paid' && (
                        <p className="mt-3 text-xs text-slate-400">
                          Customer online bhi pay kar sakta hai. Tab ye apne aap "Paid" ho jayega.
                        </p>
                      )}
                      {b.status === 'Completed' && b.paymentStatus === 'paid' && (
                        <p className="mt-3 text-sm font-medium text-emerald-700">
                          {rupees(b.paidAmount || b.price)} paid ({b.paidVia === 'cash' ? 'cash' : 'online'})
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )
            )}

            {/* ── Profile ── */}
            {loaded && tab === 'profile' && (
              <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
                <div>
                  <h3 className="mb-3 font-bold text-slate-900">Profile photo</h3>
                  <Message kind={photoMsg.kind === 'error' ? 'error' : 'ok'}>{photoMsg.text}</Message>
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 p-5">
                    {profile?.photoUrl ? (
                      <img src={profile.photoUrl} alt="Your profile" className="h-32 w-32 rounded-full border-4 border-primary-100 object-cover" />
                    ) : (
                      <span className="flex h-32 w-32 items-center justify-center rounded-full bg-primary-50 text-primary" aria-hidden="true">
                        <User size={48} />
                      </span>
                    )}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadPhoto} aria-label="Choose profile photo" />
                    <div className="flex w-full flex-col gap-2">
                      <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
                        {photoBusy ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                        {profile?.photoUrl ? 'Photo badlo' : 'Photo daalo'}
                      </button>
                      {profile?.photoUrl && (
                        <button type="button" className="btn-danger" onClick={removePhoto} disabled={photoBusy}>
                          <Trash2 size={16} aria-hidden="true" /> Photo hatao
                        </button>
                      )}
                    </div>
                    <p className="text-center text-xs text-slate-400">JPG, PNG ya WEBP, 5MB tak. Saaf chehre wali photo se customer ka bharosa badhta hai.</p>
                  </div>
                </div>

                <form onSubmit={saveProfile} className="space-y-4">
                  <h3 className="font-bold text-slate-900">Aapki details</h3>
                  <Message kind={formMsg.kind === 'error' ? 'error' : 'ok'}>{formMsg.text}</Message>

                  <div>
                    <label htmlFor="wp-service" className="mb-1 block text-sm font-medium text-slate-700">Service</label>
                    <select id="wp-service" className="input" required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                      <option value="">Service chuno</option>
                      {Object.keys(SERVICE_PRICES).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="wp-city" className="mb-1 block text-sm font-medium text-slate-700">City</label>
                      <input id="wp-city" className="input" maxLength={50} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="wp-exp" className="mb-1 block text-sm font-medium text-slate-700">Experience</label>
                      <input id="wp-exp" className="input" maxLength={40} placeholder="jaise 3 saal" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="wp-about" className="mb-1 block text-sm font-medium text-slate-700">Apne baare mein</label>
                    <textarea id="wp-about" rows={4} className="input resize-none" maxLength={500} placeholder="Customer ko batao aap kya kaam karte ho" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
                  </div>
                  <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    Service ka rate platform tay karta hai, isliye price yahan nahi badalta.
                  </p>
                  <button type="submit" className="btn-primary" disabled={savingForm}>
                    {savingForm ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                    Save karo
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer's 4-digit code (start / finish) */}
      {otpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Customer code">
          <div className="absolute inset-0 bg-black/50" onClick={closeOtp} />
          <form onSubmit={submitOtp} className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-slate-900">
              {otpModal.kind === 'start' ? 'Kaam shuru karo' : 'Kaam poora karo'}
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              Customer ke phone par dikh rahe <strong>{otpModal.kind === 'start' ? 'START' : 'END'}</strong> code ko puchho aur yahan daalo.
            </p>
            {otpError && (
              <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {otpError}
              </div>
            )}
            <OtpInput value={otpValue} onChange={(v) => { setOtpValue(v); setOtpError(''); }} length={4} />
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={closeOtp} className="btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={otpBusy || otpValue.length !== 4} className="btn-primary flex-1">
                {otpBusy ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : null}
                {otpBusy ? 'Wait...' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default WorkerDashboard;
