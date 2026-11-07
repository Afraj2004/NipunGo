import React, { useState, useEffect, useRef } from 'react';

// A single, large numeric input for one-time codes.
// - digits only, fixed length, numeric keypad on phones
// - autocomplete="one-time-code" lets phones offer the code from SMS/email
// - paste friendly ("123 456" -> "123456")
function OtpInput({ value, onChange, length = 6, autoFocus = true, disabled = false, id = 'otp' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d*"
      maxLength={length}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
      placeholder={'•'.repeat(length)}
      aria-label={`${length} digit code`}
      className="w-full text-center text-3xl font-bold tracking-[0.5em] pl-[0.5em] py-4 border-2 border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition bg-white disabled:opacity-60"
    />
  );
}

// Seconds left until "resend" is allowed again. start(30) begins a countdown.
export const useCountdown = (initial = 0) => {
  const [seconds, setSeconds] = useState(initial);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return [seconds, setSeconds];
};

export default OtpInput;
