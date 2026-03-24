import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

function Dashboard() {
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
    setUser(parsedUser);
    fetchMyBookings(parsedUser.id, token);
  }, [navigate]);

  const fetchMyBookings = async (userId, token) => {
    try {
      const response = await axios.get(
        `/booking/my-bookings/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
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

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Booking cancel karna chahte ho?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/booking/cancel/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setBookings(bookings.map(booking =>
          booking._id === bookingId
            ? { ...booking, status: 'Cancelled' }
            : booking
        ));
      }
    } catch (error) {
      alert('Kuch galat hua!');
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status.toLowerCase() === activeTab;
  });

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    confirmed: bookings.filter(b => b.status === 'Confirmed').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    cancelled: bookings.filter(b => b.status === 'Cancelled').length,
    totalSpent: bookings
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return '⏳';
      case 'Confirmed': return '✅';
      case 'Completed': return '🎉';
      case 'Cancelled': return '❌';
      default: return '❓';
    }
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
      'IT Support': '🖥️',
      'Laundry': '🧺',
      'Pest Control': '🐛',
    };
    return icons[service] || '🔧';
  };

  const tabs = [
    { id: 'all', label: 'Sabhi', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'confirmed', label: 'Confirmed', count: stats.confirmed },
    { id: 'completed', label: 'Completed', count: stats.completed },
    { id: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

      {/* ===== HEADER SECTION ===== */}
      <section className="bg-gradient-to-br from-indigo-900 via-primary to-indigo-700 pt-10 pb-24 px-4 relative overflow-hidden">

        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary opacity-10 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto relative z-10">

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            {/* Avatar */}
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl backdrop-blur-sm border border-white border-opacity-30">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-indigo-300 text-sm">
                Welcome back! 👋
              </p>
              <h1 className="text-2xl font-bold text-white">
                {user?.name}
              </h1>
              <p className="text-indigo-300 text-sm">
                {user?.email}
              </p>
            </div>
          </motion.div>

          {/* Stats Cards */}
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
                color: "from-blue-400 to-blue-600"
              },
              {
                label: "Pending",
                value: stats.pending,
                icon: "⏳",
                color: "from-yellow-400 to-yellow-600"
              },
              {
                label: "Completed",
                value: stats.completed,
                icon: "✅",
                color: "from-green-400 to-green-600"
              },
              {
                label: "Total Spent",
                value: `₹${stats.totalSpent}`,
                icon: "💰",
                color: "from-purple-400 to-purple-600"
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -3 }}
                className="bg-white bg-opacity-15 backdrop-blur-sm rounded-2xl p-4 border border-white border-opacity-20"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <h3 className="text-2xl font-bold text-white">
                  {stat.value}
                </h3>
                <p className="text-indigo-300 text-sm">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 pb-12 relative z-10">

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            {
              label: "New Booking",
              icon: "🔧",
              color: "bg-primary",
              action: () => navigate('/services')
            },
            {
              label: "Services",
              icon: "⚡",
              color: "bg-secondary",
              action: () => navigate('/services')
            },
            {
              label: "Home",
              icon: "🏠",
              color: "bg-green-500",
              action: () => navigate('/')
            },
            {
              label: "Profile",
              icon: "👤",
              color: "bg-purple-500",
              action: () => {}
            },
          ].map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className={`${action.color} text-white p-4 rounded-2xl font-medium shadow-lg flex items-center gap-3 justify-center`}
            >
              <span className="text-xl">{action.icon}</span>
              <span>{action.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Bookings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >

          {/* Section Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Meri Bookings
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/services')}
                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                + New Booking
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-white bg-opacity-30 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {filteredBookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-gray-600 text-xl font-medium mb-2">
                    Koi booking nahi hai!
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Abhi pehli booking karo
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/services')}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold"
                  >
                    Services Dekho 🔧
                  </motion.button>
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
                      whileHover={{ x: 3 }}
                      className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">

                        {/* Service Icon */}
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                          {getServiceIcon(booking.service)}
                        </div>

                        {/* Booking Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                            <h3 className="font-bold text-gray-800 text-lg">
                              {booking.service}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)} {booking.status}
                            </span>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <span>📅</span>
                              <span>{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <span>⏰</span>
                              <span>{booking.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm col-span-2">
                              <span>📍</span>
                              <span className="truncate">{booking.address}</span>
                            </div>
                            {booking.description && (
                              <div className="flex items-center gap-2 text-gray-500 text-sm col-span-2">
                                <span>📝</span>
                                <span className="truncate">{booking.description}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-secondary font-bold text-lg">
                              ₹{booking.price}
                            </span>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {booking.status === 'Pending' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleCancel(booking._id)}
                                  className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-red-100 transition"
                                >
                                  ❌ Cancel
                                </motion.button>
                              )}
                              {booking.status === 'Completed' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => navigate(`/review/${booking._id}`)}
                                  className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-yellow-100 transition"
                                >
                                  ⭐ Review Do
                                </motion.button>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/services')}
                                className="bg-indigo-50 text-primary border border-indigo-200 px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-indigo-100 transition"
                              >
                                🔄 Book Again
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>

        {/* Empty State - No Bookings At All */}
        {bookings.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-r from-primary to-indigo-800 rounded-2xl p-8 text-center text-white"
          >
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold mb-2">
              Pehli Booking Karo!
            </h3>
            <p className="text-indigo-200 mb-6">
              Hazaro verified experts tayar hain
              aapki help ke liye!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/services')}
              className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition"
            >
              Services Dekho →
            </motion.button>
          </motion.div>
        )}

      </section>
    </div>
  );
}

export default Dashboard;