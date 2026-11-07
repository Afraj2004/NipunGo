import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';
import AddressManager from '../components/AddressManager';
import { getUser, saveSession } from '../utils/auth';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

const input =
  'w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition bg-white';

function Card({ title, subtitle, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Message({ kind, children }) {
  if (!children) return null;
  const styles =
    kind === 'error'
      ? 'bg-red-50 border-red-200 text-red-600'
      : 'bg-green-50 border-green-200 text-green-700';
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`border p-3 rounded-xl mb-4 text-sm ${styles}`}>
      {kind === 'error' ? '⚠️' : '✅'} {children}
    </div>
  );
}

// "My account" for customers and workers: details, password, saved addresses
function Profile() {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [name, setName] = useState('');
  const [nameMsg, setNameMsg] = useState({ kind: '', text: '' });
  const [savingName, setSavingName] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState({ kind: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    axios
      .get('/user/profile')
      .then((res) => {
        setProfile(res.data.user);
        setName(res.data.user.name);
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Profile load nahi ho saka.'));
  }, []);

  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    setNameMsg({ kind: '', text: '' });
    try {
      const res = await axios.put('/user/profile', { name });
      setProfile(res.data.user);
      // keep the navbar/greeting in sync
      saveSession({ token: localStorage.getItem('token'), user: { ...getUser(), name: res.data.user.name } });
      setNameMsg({ kind: 'ok', text: 'Naam update ho gaya!' });
    } catch (err) {
      setNameMsg({ kind: 'error', text: err.response?.data?.message || 'Naam update nahi hua.' });
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ kind: '', text: '' });
    if (!PASSWORD_RULE.test(pw.newPassword)) {
      return setPwMsg({
        kind: 'error',
        text: 'Naya password kam se kam 8 characters ka ho, usme ek letter aur ek number zaroor ho!',
      });
    }
    setSavingPw(true);
    try {
      const res = await axios.put('/user/password', pw);
      // The server logs out every other device and gives this one a fresh token
      saveSession({ token: res.data.token, user: getUser() });
      setPw({ currentPassword: '', newPassword: '' });
      setPwMsg({ kind: 'ok', text: 'Password change ho gaya! Baaki devices logout ho gaye hain.' });
    } catch (err) {
      setPwMsg({ kind: 'error', text: err.response?.data?.message || 'Password change nahi hua.' });
    } finally {
      setSavingPw(false);
    }
  };

  if (loadError) {
    return <div className="max-w-2xl mx-auto px-4 py-10"><Message kind="error">{loadError}</Message></div>;
  }
  if (!profile) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-gray-400">Loading...</div>;
  }

  const isWorker = profile.role === 'worker';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        {isWorker && profile.photoUrl ? (
          <img src={profile.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold" aria-hidden="true">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 truncate">{profile.name}</h1>
          <p className="text-gray-500 text-sm capitalize">{profile.role} account</p>
        </div>
      </div>

      <Card title="👤 Account details">
        <Message kind={nameMsg.kind === 'error' ? 'error' : 'ok'}>{nameMsg.text}</Message>
        <form onSubmit={saveName} className="grid gap-4">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input id="profile-name" className={input} value={name} onChange={(e) => { setName(e.target.value); setNameMsg({ kind: '', text: '' }); }} maxLength={50} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className={`${input} bg-gray-50 text-gray-500`} value={profile.email} readOnly aria-readonly="true" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className={`${input} bg-gray-50 text-gray-500`} value={profile.phone} readOnly aria-readonly="true" />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">Email aur phone badalne ke liye support se baat karo.</p>
          <button
            type="submit"
            disabled={savingName || name.trim() === profile.name}
            className="sm:w-fit bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {savingName ? '⏳ Saving...' : 'Save changes'}
          </button>
        </form>
      </Card>

      {isWorker ? (
        <Card title="🛠️ Worker profile" subtitle="Photo, service, price, experience aur availability.">
          <Link
            to="/worker/dashboard"
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Dashboard mein Profile tab kholo →
          </Link>
        </Card>
      ) : (
        <Card
          title="📍 Saved addresses"
          subtitle="Booking karte waqt ek tap mein address chuno. Aap 5 tak save kar sakte ho."
        >
          <AddressManager />
        </Card>
      )}

      <Card title="🔒 Change password" subtitle="Password badalne par baaki sab devices logout ho jaate hain.">
        <Message kind={pwMsg.kind === 'error' ? 'error' : 'ok'}>{pwMsg.text}</Message>
        <form onSubmit={changePassword} className="grid gap-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">Purana password</label>
            <input
              id="current-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              className={input}
              value={pw.currentPassword}
              onChange={(e) => { setPw({ ...pw, currentPassword: e.target.value }); setPwMsg({ kind: '', text: '' }); }}
              required
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Naya password</label>
            <input
              id="new-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8+ characters, letter + number"
              className={input}
              value={pw.newPassword}
              onChange={(e) => { setPw({ ...pw, newPassword: e.target.value }); setPwMsg({ kind: '', text: '' }); }}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
            Password dikhao
          </label>
          <button
            type="submit"
            disabled={savingPw}
            className="sm:w-fit bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {savingPw ? '⏳ Wait...' : 'Password badlo'}
          </button>
        </form>
      </Card>
    </div>
  );
}

export default Profile;
