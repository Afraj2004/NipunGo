import React from 'react';
import { Link } from 'react-router-dom';
import { getUser, homeFor } from '../utils/auth';

function NotFound() {
  const user = getUser();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-7xl mb-4" aria-hidden="true">🧭</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Page nahi mila</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Jo page aap dhoondh rahe ho wo hata diya gaya hai ya link galat hai.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
        >
          🏠 Home
        </Link>
        {user && (
          <Link
            to={homeFor(user.role)}
            className="border-2 border-primary text-primary px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition"
          >
            📋 Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

export default NotFound;
