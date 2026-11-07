import React, { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axios';

const EMPTY = { label: 'Home', line: '', landmark: '', city: '', pincode: '' };
const LABEL_ICON = { Home: '🏠', Work: '🏢', Other: '📍' };

const field =
  'w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition bg-white';

// Saved addresses: list, add, edit, delete, choose the default (max 5, enforced by the server)
function AddressManager() {
  const [addresses, setAddresses] = useState([]);
  const [max, setMax] = useState(5);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | address _id
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/user/addresses');
      setAddresses(res.data.addresses || []);
      setMax(res.data.max || 5);
    } catch (err) {
      setError(err.response?.data?.message || 'Addresses load nahi ho paye.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startNew = () => { setForm(EMPTY); setEditing('new'); setError(''); };
  const startEdit = (a) => {
    setForm({ label: a.label, line: a.line, landmark: a.landmark || '', city: a.city, pincode: a.pincode });
    setEditing(a._id);
    setError('');
  };
  const cancel = () => { setEditing(null); setError(''); };

  const run = async (request) => {
    setBusy(true);
    setError('');
    try {
      const res = await request();
      setAddresses(res.data.addresses || []);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Kuch galat hua!');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const ok = await run(() =>
      editing === 'new'
        ? axios.post('/user/addresses', form)
        : axios.put(`/user/addresses/${editing}`, form)
    );
    if (ok) setEditing(null);
  };

  const remove = (a) => {
    if (!window.confirm(`"${a.label}" address delete karna hai?`)) return;
    run(() => axios.delete(`/user/addresses/${a._id}`));
  };

  const makeDefault = (a) => run(() => axios.put(`/user/addresses/${a._id}/default`));

  const set = (name) => (e) => { setForm({ ...form, [name]: e.target.value }); setError(''); };

  if (loading) return <p className="text-gray-400 text-sm">Addresses load ho rahe hain...</p>;

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {addresses.length === 0 && !editing && (
        <p className="text-gray-500 text-sm mb-4">
          Abhi koi address save nahi hai. Ek baar save karo, phir booking mein ek tap mein use karo.
        </p>
      )}

      <ul className="grid gap-3 mb-4">
        {addresses.map((a) => (
          <li
            key={a._id}
            className={`rounded-xl border-2 p-4 ${a.isDefault ? 'border-primary bg-indigo-50/50' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-800">
                    {LABEL_ICON[a.label]} {a.label}
                  </span>
                  {a.isDefault && (
                    <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Default</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm break-words">{a.full}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {!a.isDefault && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => makeDefault(a)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-indigo-50 disabled:opacity-50"
                >
                  Default banao
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => startEdit(a)}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(a)}
                className="text-sm px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                🗑️ Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <form onSubmit={save} className="rounded-xl border-2 border-primary/30 p-4 bg-white">
          <h4 className="font-semibold text-gray-800 mb-3">
            {editing === 'new' ? 'Naya address' : 'Address edit karo'}
          </h4>

          <div className="flex gap-2 mb-3" role="group" aria-label="Address type">
            {['Home', 'Work', 'Other'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setForm({ ...form, label: l })}
                className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition ${
                  form.label === l ? 'border-primary bg-indigo-50 text-primary' : 'border-gray-200 text-gray-600'
                }`}
              >
                {LABEL_ICON[l]} {l}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            <input className={field} placeholder="Ghar / flat no., building, area" value={form.line} onChange={set('line')} required maxLength={150} />
            <input className={field} placeholder="Landmark (optional)" value={form.landmark} onChange={set('landmark')} maxLength={80} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={field} placeholder="City" value={form.city} onChange={set('city')} required maxLength={50} />
              <input
                className={field}
                placeholder="Pincode (6 digit)"
                value={form.pincode}
                onChange={(e) => { setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }); setError(''); }}
                inputMode="numeric"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button type="button" onClick={cancel} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-60">
              {busy ? '⏳ Saving...' : 'Save ✅'}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={startNew}
          disabled={addresses.length >= max}
          className="w-full border-2 border-dashed border-primary/40 text-primary py-3 rounded-xl font-semibold hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addresses.length >= max ? `Max ${max} addresses save ho sakte hain` : '➕ Naya address add karo'}
        </button>
      )}
    </div>
  );
}

export default AddressManager;
