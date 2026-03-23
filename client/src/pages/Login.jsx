import React, { useState } from 'react';
import axios from '../utils/axios';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        '/auth/login',
        formData
      );

      if (response.data.success) {
        // Token save karo
        localStorage.setItem(
          'token',
          response.data.token
        );
        localStorage.setItem(
          'user',
          JSON.stringify(response.data.user)
        );

        // Home page par bhejo
        window.location.href = '/';
      }

    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Kuch galat hua!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        <h2 className="text-3xl font-bold text-center text-primary mb-2">
          Welcome Back!
        </h2>
        <p className="text-center text-gray-500 mb-6">
          NipunGo mein login karo
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Email likho"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password likho"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            {loading ? 'Wait Karo...' : 'Login Karo'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-4">
          Account nahi hai?{" "}
          <a href="/register" className="text-primary font-medium">
            Register Karo
          </a>
        </p>

      </div>
    </div>
  );
}

export default Login;