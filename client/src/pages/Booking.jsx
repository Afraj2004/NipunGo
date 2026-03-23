import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

function Booking() {
  const { serviceName } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    address: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      const response = await axios.post(
        '/booking/create',
        {
          customer: user.id,
          service: serviceName,
          date: formData.date,
          time: formData.time,
          address: formData.address,
          description: formData.description,
          price: 200,
          // Temporary worker id
          worker: user.id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Booking Ho Gayi! 🎉');
        setTimeout(() => {
          navigate('/');
        }, 2000);
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-indigo-800 rounded-2xl p-8 text-white text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Book {serviceName}
          </h1>
          <p className="text-indigo-200">
            Expert worker aapke ghar aayega!
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Error */}
          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-center">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-100 text-green-600 p-3 rounded-xl mb-4 text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                📅 Date Select Karo
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            {/* Time */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                ⏰ Time Select Karo
              </label>
              <select
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Time choose karo</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                📍 Apna Address Likho
              </label>
              <textarea
                name="address"
                placeholder="Ghar ka pura address likho..."
                value={formData.address}
                onChange={handleChange}
                required
                rows="3"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                📝 Problem Describe Karo
              </label>
              <textarea
                name="description"
                placeholder="Kya problem hai? Detail mein likho..."
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            {/* Price Info */}
            <div className="bg-indigo-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Service:</span>
                <span className="font-bold">{serviceName}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Starting Price:</span>
                <span className="font-bold text-secondary">₹200</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-lg"
            >
              {loading ? 'Booking Ho Rahi Hai...' : 'Booking Confirm Karo ✅'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Booking;