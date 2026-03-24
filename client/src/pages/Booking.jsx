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

  const handlePayment = async (bookingId, amount) => {
    try {
      const token = localStorage.getItem('token');

      // Order banao
      const orderResponse = await axios.post(
        '/payment/create-order',
        {
          amount,
          bookingId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const { order, key } = orderResponse.data;
      const user = JSON.parse(localStorage.getItem('user'));

      // Razorpay checkout open karo
      const options = {
        key,
        amount: order.amount,
        currency: 'INR',
        name: 'NipunGo',
        description: `${serviceName} Service Booking`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // Payment verify karo
            const verifyResponse = await axios.post(
              '/payment/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (verifyResponse.data.success) {
              setSuccess('Payment aur Booking Successful! 🎉');
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            }
          } catch (error) {
            setError('Payment verification failed!');
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#4F46E5'
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch (error) {
      setError('Payment shuru nahi ho saka!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      // Booking banao
      const response = await axios.post(
        '/booking/create',
        {
          customer: user.id,
          worker: user.id,
          service: serviceName,
          date: formData.date,
          time: formData.time,
          address: formData.address,
          description: formData.description,
          price: 200
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Payment shuru karo
        await handlePayment(
          response.data.booking._id,
          200
        );
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
                <span className="text-gray-600">Price:</span>
                <span className="font-bold text-secondary">₹200</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Payment:</span>
                <span className="font-bold text-green-600">
                  Online 💳
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-lg"
            >
              {loading
                ? 'Processing...'
                : 'Book Karo & Pay Karo 💳'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Booking;