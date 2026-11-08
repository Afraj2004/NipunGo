import React, { useState } from 'react';
import { Phone, Loader2, AlertTriangle } from 'lucide-react';
import axios from '../utils/axios';

const isPhone = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// "Call karo" for the other person on a booking.
// The number is NOT on the page until this is pressed: the server only hands it to the customer or
// the assigned worker of this booking, only while the job is active or payment is still due, and
// logs every request. On a phone it dials straight away; elsewhere the number is shown with a link.
function CallButton({ bookingId, className = '' }) {
  const [state, setState] = useState({ status: 'idle' });

  const reveal = async () => {
    setState({ status: 'loading' });
    try {
      const res = await axios.get(`/booking/call/${bookingId}`);
      setState({ status: 'ready', name: res.data.name, phone: res.data.phone });
      if (isPhone()) window.location.href = `tel:${res.data.phone}`;
    } catch (err) {
      setState({ status: 'error', message: err.response?.data?.message || 'Number abhi nahi mil paya.' });
    }
  };

  if (state.status === 'ready') {
    return (
      <div className={className}>
        <a
          href={`tel:${state.phone}`}
          className="btn bg-emerald-600 text-white shadow-card hover:bg-emerald-700 w-full sm:w-auto"
        >
          <Phone size={16} aria-hidden="true" /> {state.name}: {state.phone}
        </a>
        <p className="mt-1 text-xs text-slate-400">Ye number sirf is booking ke liye hai.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={reveal}
        disabled={state.status === 'loading'}
        className="btn bg-emerald-600 text-white shadow-card hover:bg-emerald-700 w-full sm:w-auto"
      >
        {state.status === 'loading'
          ? <Loader2 className="animate-spin" size={16} aria-hidden="true" />
          : <Phone size={16} aria-hidden="true" />}
        Call karo
      </button>
      {state.status === 'error' && (
        <p role="alert" className="mt-1 flex items-start gap-1 text-xs text-red-600">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> {state.message}
        </p>
      )}
    </div>
  );
}

export default CallButton;
