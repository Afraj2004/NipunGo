import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

function WorkerDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!savedUser || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    // Worker nahi hai toh customer dashboard par bhejo
    if (parsedUser.role !== 'worker') {
      navigate('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchWorkerBookings(parsedUser.id, token);
  }, [navigate]);

  const fetchWorkerBookings = async (workerId, token) => {
    try {
      const response = await axios.get(
        `/booking/worker-bookings/${workerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setBookings(response.data.bookings);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/booking/accept/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setBookings(bookings.map(b =>
          b._id === bookingId
            ? { ...b, status: 'Confirmed' }
            : b
        ));
        alert('Booking Accept Ho Gayi! ✅');
      }
    } catch (error) {
      alert('Kuch galat hua!');
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/booking/complete/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setBookings(bookings.map(b =>
          b._id === bookingId
            ? { ...b, status: 'Completed' }
            : b
        ));
        alert('Booking Complete Ho Gayi! 🎉');
      }
    } catch (error) {
      alert('Kuch galat hua!');
    }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('Booking reject karna chahte ho?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/booking/cancel/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(bookings.map(b =>
        b._id === bookingId
          ? { ...b, status: 'Cancelled' }
          : b
      ));
    } catch (error) {
      alert('Kuch galat hua!');
    }
  };

  // Filter
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    return b.status.toLowerCase() === activeTab;
  });

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    confirmed: bookings.filter(b => b.status === 'Confirmed').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    earnings: bookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + b.price, 0)
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-600 border border-yellow-200';
      case 'Confirmed': return 'bg-blue-100 text-blue-600 border border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-600 border border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-600 border border-red-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const tabs = [
    { id: 'all', label: 'Sabhi', count: stats.total },
    { id: 'pending', label: 'New', count: stats.pending },
    { id: 'confirmed', label: 'Confirmed', count: stats.confirmed },
    { id: 'completed', label: 'Completed', count: stats.completed },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== HEADER ===== */}
      <section className="bg-gradient-to-br from-gray-800 via-gray-900 to-black pt-10 pb-24 px-4 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto relative z-10">

          {/* Worker Badge */}
          <div className="inline-block bg-primary bg-opacity-20 text-primary px-4 py-1 rounded-full text-sm font-medium mb-4 border border-primary border-opacity-30">
            👷 Worker Dashboard
          </div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-16 h-16 bg-white bg-opacity-10 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border border-white border-opacity-20">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {user?.name}
              </h1>
              <p className="text-gray-400 text-sm">
                👷 Professional Worker
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              {
                label: "Total Bookings",
                value: stats.total,
                icon: "📋",
              },
              {
                label: "New Requests",
                value: stats.pending,
                icon: "🔔",
              },
              {
                label: "Completed",
                value: stats.completed,
                icon: "✅",
              },
              {
                label: "Total Earnings",
                value: `₹${stats.earnings}`,
                icon: "💰",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 border border-white border-opacity-10"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <h3 className="text-2xl font-bold text-white">
                  {stat.value}
                </h3>
                <p className="text-gray-400 text-sm">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 pb-12">

        {/* New Booking Alert */}
        {stats.pending > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-center gap-3"
          >
            <div className="text-2xl animate-bounce">🔔</div>
            <div>
              <p className="font-bold text-yellow-700">
                {stats.pending} New Booking Request!
              </p>
              <p className="text-yellow-600 text-sm">
                Jaldi accept karo!
              </p>
            </div>
            <button
              onClick={() => setActiveTab('pending')}
              className="ml-auto bg-yellow-400 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              Dekho →
            </button>
          </motion.div>
        )}

        {/* Bookings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >

          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Booking Requests
            </h2>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bookings */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {filteredBookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 text-lg">
                    Koi booking nahi hai!
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4"
                >
                  {filteredBookings.map((booking, index) => (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-2 rounded-2xl p-5 transition ${
                        booking.status === 'Pending'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-100 bg-white'
                      }`}
                    >

                      {/* Booking Header */}
                      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-800 text-lg">
                              {booking.service}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm">
                            Booking ID: #{booking._id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                        <span className="text-secondary font-bold text-xl">
                          ₹{booking.price}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-white rounded-xl p-4 mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-primary font-bold">
                          {booking.customer?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {booking.customer?.name}
                          </p>
                          <p className="text-gray-500 text-sm">
                            📱 {booking.customer?.phone}
                          </p>
                          <p className="text-gray-500 text-sm">
                            📧 {booking.customer?.email}
                          </p>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-gray-400 text-xs mb-1">Date</p>
                          <p className="font-medium text-gray-800">
                            📅 {booking.date}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-gray-400 text-xs mb-1">Time</p>
                          <p className="font-medium text-gray-800">
                            ⏰ {booking.time}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                          <p className="text-gray-400 text-xs mb-1">Address</p>
                          <p className="font-medium text-gray-800">
                            📍 {booking.address}
                          </p>
                        </div>
                        {booking.description && (
                          <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                            <p className="text-gray-400 text-xs mb-1">Problem</p>
                            <p className="font-medium text-gray-800">
                              📝 {booking.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {booking.status === 'Pending' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleReject(booking._id)}
                              className="flex-1 bg-red-50 text-red-500 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-100 transition"
                            >
                              ❌ Reject
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAccept(booking._id)}
                              className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg"
                            >
                              ✅ Accept Karo
                            </motion.button>
                          </>
                        )}

                        {booking.status === 'Confirmed' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleComplete(booking._id)}
                            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
                          >
                            🎉 Mark as Complete
                          </motion.button>
                        )}

                        {booking.status === 'Completed' && (
                          <div className="flex-1 bg-green-50 text-green-600 border border-green-200 py-3 rounded-xl font-bold text-center">
                            ✅ Completed
                          </div>
                        )}

                        {booking.status === 'Cancelled' && (
                          <div className="flex-1 bg-red-50 text-red-400 border border-red-200 py-3 rounded-xl font-bold text-center">
                            ❌ Cancelled
                          </div>
                        )}
                      </div>

                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      </section>
    </div>
  );
}

export default WorkerDashboard;