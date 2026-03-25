import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../utils/axios';

function WorkerProfile() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchWorker = useCallback(async () => {
    try {
      const response = await axios.get(`/worker/${workerId}`);
      if (response.data.success) {
        setWorker(response.data.worker);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await axios.get(
        `/review/worker/${workerId}`
      );
      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorker();
    fetchReviews();
  }, [fetchWorker, fetchReviews]);

  const handleBookNow = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Pehle Login Karo!');
      navigate('/login');
      return;
    }
    navigate(`/booking/${worker.service}`);
  };

  const getServiceIcon = (service) => {
    const icons = {
      'Plumber': '🔧',
      'Electrician': '⚡',
      'Carpenter': '🪚',
      'Painter': '🎨',
      'AC Mechanic': '❄️',
      'Cleaner': '🧹',
      'Locksmith': '🔒',
      'Gardener': '🌿',
    };
    return icons[service] || '👷';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-4xl"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-gray-500 text-xl">
            Worker nahi mila!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* ===== PROFILE CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6"
        >

          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-900 via-primary to-indigo-700 p-8 relative overflow-hidden">

            {/* Background */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-5 relative z-10">

              {/* Avatar */}
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-5xl backdrop-blur-sm border border-white border-opacity-30">
                {getServiceIcon(worker.service)}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-white">
                    {worker.name}
                  </h1>
                  {worker.isVerified && (
                    <span className="bg-green-400 text-white text-xs px-2 py-1 rounded-full font-medium">
                      ✅ Verified
                    </span>
                  )}
                </div>
                <p className="text-indigo-200 font-medium">
                  {worker.service} Expert
                </p>
                <p className="text-indigo-300 text-sm mt-1">
                  📍 {worker.city || 'Location not set'}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {[1,2,3,4,5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= Math.round(worker.rating || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-500'
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="text-white font-bold">
                    {worker.rating || '0'}
                  </span>
                  <span className="text-indigo-300 text-sm">
                    ({worker.totalReviews || 0} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mt-6 relative z-10">
              {[
                {
                  label: "Experience",
                  value: worker.experience || '2+ Years',
                  icon: "💼"
                },
                {
                  label: "Price",
                  value: `₹${worker.price || 200}`,
                  icon: "💰"
                },
                {
                  label: "Reviews",
                  value: worker.totalReviews || 0,
                  icon: "⭐"
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white bg-opacity-15 rounded-xl p-3 text-center backdrop-blur-sm border border-white border-opacity-20"
                >
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="text-white font-bold">
                    {stat.value}
                  </div>
                  <div className="text-indigo-300 text-xs">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="p-6">

            {/* About */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                👨‍🔧 About
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {worker.about ||
                  `Professional ${worker.service} with ${worker.experience || '2+'} years of experience. Quality work guaranteed with best service!`
                }
              </p>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                🛠️ Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  worker.service,
                  "Professional",
                  "Verified",
                  "Experienced",
                  "Reliable",
                  "On Time"
                ].map((skill, index) => (
                  <span
                    key={index}
                    className="bg-indigo-50 text-primary px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="mb-6 bg-gray-50 rounded-xl p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                📞 Contact Info
              </h2>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">📱</span>
                  <span className="text-gray-700">{worker.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">📧</span>
                  <span className="text-gray-700">{worker.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">📍</span>
                  <span className="text-gray-700">
                    {worker.city || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Book Button - Sirf Customer Dekhe */}
            {currentUser && currentUser.role === 'customer' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBookNow}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                🔧 Abhi Book Karo - ₹{worker.price || 200}
              </motion.button>
            )}

            {/* Login Prompt - Agar Login Nahi Hai */}
            {!currentUser && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg"
              >
                Login Karo & Book Karo 🔧
              </motion.button>
            )}

            {/* Worker View - Apna Profile Dekh Raha Hai */}
            {currentUser &&
             currentUser.role === 'worker' &&
             currentUser.id === workerId && (
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-primary font-medium">
                  👋 Ye Aapka Profile Hai!
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Dashboard mein apni bookings dekho
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-3 bg-primary text-white px-6 py-2 rounded-xl font-medium"
                >
                  Dashboard Dekho →
                </button>
              </div>
            )}

          </div>
        </motion.div>

        {/* ===== REVIEWS SECTION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              ⭐ Customer Reviews
            </h2>
            <span className="bg-indigo-50 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {reviews.length} Reviews
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-500">
                Abhi koi review nahi hai
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">

                    {/* Avatar */}
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {review.customer?.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-bold text-gray-800">
                          {review.customer?.name}
                        </h4>
                        <span className="text-gray-400 text-xs">
                          {new Date(review.createdAt)
                            .toLocaleDateString('en-IN')}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex gap-0.5 my-1">
                        {[1,2,3,4,5].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>

                      <p className="text-gray-600 text-sm mt-1">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-primary font-medium hover:underline flex items-center gap-1"
        >
          ← Wapas Jao
        </button>

      </div>
    </div>
  );
}

export default WorkerProfile;