import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  // ── Auth Header Helper ──────────────────────────────
  // 👇 Yeh function har API call mein use karo
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`  // ← Yahi missing tha!
      }
    };
  };


  // ── Admin Check ─────────────────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!savedUser || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    if (parsedUser.role !== 'admin') {
      alert('Admin Only! Access Denied 🔒');
      navigate('/');
      return;
    }

    // 👇 Teeno functions yahan define karo
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          '/admin/stats',
          getAuthHeader()
        );
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.log('Stats Error:', error);
        throw error;
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          '/admin/users',
          getAuthHeader()
        );
        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (error) {
        console.log('Users Error:', error);
        throw error;
      }
    };

    const fetchBookings = async () => {
      try {
        const response = await axios.get(
          '/admin/bookings',
          getAuthHeader()
        );
        if (response.data.success) {
          setBookings(response.data.bookings);
        }
      } catch (error) {
        console.log('Bookings Error:', error);
        throw error;
      }
    };

    const initDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([
          fetchStats(),
          fetchUsers(),
          fetchBookings()
        ]);
      } catch (err) {
        setError('Data load nahi hua. Refresh karo!');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();

  }, [navigate]);

  // ── Fetch All ───────────────────────────────────────
  const handleRefresh = async () => {
  setLoading(true);
  setError('');

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        '/admin/stats',
        getAuthHeader()
      );
      if (response.data.success) setStats(response.data.stats);
    } catch (err) {
      console.log('Stats Error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        '/admin/users',
        getAuthHeader()
      );
      if (response.data.success) setUsers(response.data.users);
    } catch (err) {
      console.log('Users Error:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(
        '/admin/bookings',
        getAuthHeader()
      );
      if (response.data.success) setBookings(response.data.bookings);
    } catch (err) {
      console.log('Bookings Error:', err);
    }
  };

  try {
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchBookings()
    ]);
  } catch (err) {
    setError('Refresh nahi hua!');
  } finally {
    setLoading(false);
  }
};


  // ── Verify Worker ────────────────────────────────────
  const handleVerifyWorker = async (workerId, workerName) => {
    if (!window.confirm(`${workerName} ko verify karna hai?`)) return;
    setActionLoading(workerId + '_verify');
    try {
      const response = await axios.put(
        `/admin/verify-worker/${workerId}`,
        {},
        getAuthHeader()  // ← FIX
      );
      if (response.data.success) {
        setUsers(prev => prev.map(u =>
          u._id === workerId ? { ...u, isVerified: true } : u
        ));
      }
    } catch (error) {
      alert('Verify nahi ho saka!');
    } finally {
      setActionLoading('');
    }
  };

  // ── Status Change ─────────────────────────────────────
  const handleStatusChange = async (bookingId, status) => {
    setActionLoading(bookingId + '_status');
    try {
      const response = await axios.put(
        `/admin/booking-status/${bookingId}`,
        { status },
        getAuthHeader()  // ← FIX
      );
      if (response.data.success) {
        setBookings(prev => prev.map(b =>
          b._id === bookingId ? { ...b, status } : b
        ));
      }
    } catch (error) {
      alert('Status update nahi hua!');
    } finally {
      setActionLoading('');
    }
  };

  // ── Delete User ───────────────────────────────────────
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`"${userName}" ko delete karna hai? Yeh undo nahi hoga!`)) return;
    setActionLoading(userId + '_delete');
    try {
      await axios.delete(
        `/admin/user/${userId}`,
        getAuthHeader()  // ← FIX
      );
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      alert(
        error.response?.data?.message || 'Delete nahi hua!'
      );
    } finally {
      setActionLoading('');
    }
  };

  // ── Helpers ───────────────────────────────────────────
  const getStatusColor = (status) => {
    const colors = {
      'Searching': 'bg-orange-100 text-orange-600',
      'Confirmed': 'bg-blue-100 text-blue-600',
      'Completed': 'bg-green-100 text-green-600',
      'Cancelled': 'bg-red-100 text-red-600',
      'No Workers': 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const customers = users.filter(u => u.role === 'customer');
  const workers = users.filter(u => u.role === 'worker');
  const unverifiedWorkers = workers.filter(w => !w.isVerified);

  const tabs = [
    { id: 'stats', label: '📊 Stats', count: null },
    { id: 'users', label: '👥 Customers', count: customers.length },
    {
      id: 'workers',
      label: '👷 Workers',
      count: workers.length,
      alert: unverifiedWorkers.length > 0
    },
    { id: 'bookings', label: '📋 Bookings', count: bookings.length },
  ];

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-5xl mb-4"
          >
            ⏳
          </motion.div>
          <p className="text-gray-500 font-medium">
            Admin data load ho raha hai...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-gray-700 font-medium mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold"
          >
            Dobara Try Karo
          </button>
        </div>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900
        px-6 pt-10 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="inline-block bg-white bg-opacity-10 text-white
                px-3 py-1 rounded-full text-xs font-medium mb-3">
                🔐 Admin Panel
              </div>
              <h1 className="text-3xl font-bold text-white">
                NipunGo Dashboard
              </h1>
              <p className="text-gray-400 mt-1">
                Sabhi operations control karo
              </p>
            </div>

            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white bg-opacity-10
                text-white px-4 py-2 rounded-xl border border-white
                border-opacity-20 hover:bg-opacity-20 transition text-sm
                font-medium"
            >
              🔄 Refresh
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 pb-12">

        {/* Unverified Workers Alert */}
        <AnimatePresence>
          {unverifiedWorkers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border-2 border-yellow-200
                rounded-2xl p-4 mb-6 flex items-center gap-3"
            >
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-yellow-700">
                  {unverifiedWorkers.length} Workers pending verification!
                </p>
                <p className="text-yellow-600 text-sm">
                  Inhe verify karo taaki bookings accept kar sakein
                </p>
              </div>
              <button
                onClick={() => setActiveTab('workers')}
                className="ml-auto bg-yellow-400 text-white px-4 py-2
                  rounded-xl text-sm font-bold"
              >
                Dekho →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== STATS CARDS ===== */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Total Customers',
                // 👇 Nested stats structure — backend ke according
                value: stats.users?.totalCustomers ?? 0,
                icon: '👥',
                color: 'text-blue-600',
                bg: 'bg-blue-50'
              },
              {
                label: 'Total Workers',
                value: stats.users?.totalWorkers ?? 0,
                icon: '👷',
                color: 'text-purple-600',
                bg: 'bg-purple-50'
              },
              {
                label: 'Total Bookings',
                value: stats.bookings?.total ?? 0,
                icon: '📋',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50'
              },
              {
                label: 'Platform Earnings',
                value: `₹${stats.revenue?.platformEarnings ?? 0}`,
                icon: '💰',
                color: 'text-green-600',
                bg: 'bg-green-50'
              },
              {
                label: 'Searching',
                value: stats.bookings?.searching ?? 0,
                icon: '🔍',
                color: 'text-orange-600',
                bg: 'bg-orange-50'
              },
              {
                label: 'Confirmed',
                value: stats.bookings?.confirmed ?? 0,
                icon: '✅',
                color: 'text-blue-600',
                bg: 'bg-blue-50'
              },
              {
                label: 'Completed',
                value: stats.bookings?.completed ?? 0,
                icon: '🎉',
                color: 'text-green-600',
                bg: 'bg-green-50'
              },
              {
                label: 'Cancelled',
                value: stats.bookings?.cancelled ?? 0,
                icon: '❌',
                color: 'text-red-600',
                bg: 'bg-red-50'
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl p-5 shadow-sm
                  border border-gray-100"
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-xl
                  flex items-center justify-center text-xl mb-3`}>
                  {stat.icon}
                </div>
                <h3 className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ===== TABS ===== */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Tab Headers */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-6 py-4
                  text-sm font-medium whitespace-nowrap transition
                  border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {/* Alert dot */}
                {tab.alert && (
                  <span className="absolute top-2 right-2 w-2 h-2
                    bg-red-500 rounded-full animate-ping" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">

              {/* ── STATS TAB ─────────────────────────────── */}
              {activeTab === 'stats' && stats && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-6">
                    📊 Recent Bookings
                  </h2>

                  {stats.recentBookings?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-2">📭</div>
                      <p>Abhi koi booking nahi</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {stats.recentBookings?.map((booking, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between
                            p-4 bg-gray-50 rounded-xl flex-wrap gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100
                              rounded-xl flex items-center justify-center
                              text-primary font-bold">
                              {booking.customer?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {booking.service}
                              </p>
                              <p className="text-gray-500 text-sm">
                                👤 {booking.customer?.name} •
                                📅 {booking.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-secondary">
                              ₹{booking.price}
                            </span>
                            <span className={`px-3 py-1 rounded-full
                              text-xs font-medium
                              ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Revenue Summary */}
                  {stats.revenue && (
                    <div className="mt-6 bg-gradient-to-r from-green-50
                      to-emerald-50 rounded-2xl p-6 border border-green-100">
                      <h3 className="font-bold text-gray-800 mb-4">
                        💰 Revenue Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-sm">
                            Total Revenue
                          </p>
                          <p className="text-2xl font-bold text-gray-800">
                            ₹{stats.revenue.totalRevenue}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">
                            Platform Commission (10%)
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{stats.revenue.platformEarnings}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── CUSTOMERS TAB ─────────────────────────── */}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      👥 Sabhi Customers
                      <span className="ml-2 text-base font-normal
                        text-gray-400">
                        ({customers.length})
                      </span>
                    </h2>
                  </div>

                  {customers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-2">👤</div>
                      <p>Koi customer nahi abhi</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 rounded-xl">
                            <th className="p-3 text-left text-gray-600
                              font-medium text-sm rounded-l-xl">
                              Name
                            </th>
                            <th className="p-3 text-left text-gray-600
                              font-medium text-sm">
                              Email
                            </th>
                            <th className="p-3 text-left text-gray-600
                              font-medium text-sm">
                              Phone
                            </th>
                            <th className="p-3 text-left text-gray-600
                              font-medium text-sm">
                              Joined
                            </th>
                            <th className="p-3 text-left text-gray-600
                              font-medium text-sm rounded-r-xl">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((user, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-50
                                hover:bg-gray-50 transition"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-indigo-100
                                    rounded-full flex items-center
                                    justify-center text-primary font-bold
                                    text-sm">
                                    {user.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium
                                    text-gray-800">
                                    {user.name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-gray-600 text-sm">
                                {user.email}
                              </td>
                              <td className="p-3 text-gray-600 text-sm">
                                {user.phone}
                              </td>
                              <td className="p-3 text-gray-400 text-sm">
                                {new Date(user.createdAt)
                                  .toLocaleDateString('en-IN')}
                              </td>
                              <td className="p-3">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDeleteUser(
                                    user._id,
                                    user.name
                                  )}
                                  disabled={
                                    actionLoading === user._id + '_delete'
                                  }
                                  className="bg-red-50 text-red-500
                                    border border-red-200 px-3 py-1.5
                                    rounded-lg text-sm font-medium
                                    hover:bg-red-100 transition
                                    disabled:opacity-60"
                                >
                                  {actionLoading === user._id + '_delete'
                                    ? '⏳'
                                    : '🗑️ Delete'
                                  }
                                </motion.button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── WORKERS TAB ───────────────────────────── */}
              {activeTab === 'workers' && (
                <motion.div
                  key="workers"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      👷 Sabhi Workers
                      <span className="ml-2 text-base font-normal
                        text-gray-400">
                        ({workers.length})
                      </span>
                    </h2>
                    {unverifiedWorkers.length > 0 && (
                      <span className="bg-yellow-100 text-yellow-600
                        px-3 py-1 rounded-full text-sm font-medium">
                        ⚠️ {unverifiedWorkers.length} pending
                      </span>
                    )}
                  </div>

                  {workers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-2">👷</div>
                      <p>Koi worker registered nahi abhi</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {workers.map((worker, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border rounded-2xl p-5 ${
                            !worker.isVerified
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-gray-100 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between
                            flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100
                                rounded-2xl flex items-center justify-center
                                text-gray-600 font-bold text-xl">
                                {worker.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-gray-800">
                                    {worker.name}
                                  </h3>
                                  {worker.isVerified ? (
                                    <span className="bg-green-100
                                      text-green-600 px-2 py-0.5
                                      rounded-full text-xs font-medium">
                                      ✅ Verified
                                    </span>
                                  ) : (
                                    <span className="bg-yellow-100
                                      text-yellow-600 px-2 py-0.5
                                      rounded-full text-xs font-medium">
                                      ⏳ Unverified
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-500 text-sm">
                                  {worker.email} • {worker.phone}
                                </p>
                              </div>
                            </div>

                            {/* Worker Details */}
                            <div className="flex gap-2 flex-wrap">
                              {worker.service && (
                                <span className="bg-indigo-50 text-primary
                                  px-3 py-1 rounded-full text-sm">
                                  🔧 {worker.service}
                                </span>
                              )}
                              {worker.city && (
                                <span className="bg-gray-100 text-gray-600
                                  px-3 py-1 rounded-full text-sm">
                                  📍 {worker.city}
                                </span>
                              )}
                              {worker.price > 0 && (
                                <span className="bg-green-50 text-green-600
                                  px-3 py-1 rounded-full text-sm">
                                  💰 ₹{worker.price}
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full
                                text-sm ${
                                worker.isAvailable
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {worker.isAvailable
                                  ? '🟢 Available'
                                  : '🔴 Busy'
                                }
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-4">
                            {!worker.isVerified && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleVerifyWorker(
                                  worker._id,
                                  worker.name
                                )}
                                disabled={
                                  actionLoading === worker._id + '_verify'
                                }
                                className="bg-green-500 text-white px-4
                                  py-2 rounded-xl text-sm font-bold
                                  hover:bg-green-600 transition
                                  disabled:opacity-60"
                              >
                                {actionLoading === worker._id + '_verify'
                                  ? '⏳ Verifying...'
                                  : '✅ Verify Karo'
                                }
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleDeleteUser(
                                worker._id,
                                worker.name
                              )}
                              disabled={
                                actionLoading === worker._id + '_delete'
                              }
                              className="bg-red-50 text-red-500 border
                                border-red-200 px-4 py-2 rounded-xl
                                text-sm font-bold hover:bg-red-100
                                transition disabled:opacity-60"
                            >
                              {actionLoading === worker._id + '_delete'
                                ? '⏳'
                                : '🗑️ Delete'
                              }
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── BOOKINGS TAB ──────────────────────────── */}
              {activeTab === 'bookings' && (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      📋 Sabhi Bookings
                      <span className="ml-2 text-base font-normal
                        text-gray-400">
                        ({bookings.length})
                      </span>
                    </h2>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-2">📭</div>
                      <p>Koi booking nahi abhi</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {bookings.map((booking, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border border-gray-100 rounded-2xl
                            p-5 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between
                            flex-wrap gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-800 text-lg">
                                  {booking.service}
                                </h3>
                                <span className={`px-3 py-1 rounded-full
                                  text-xs font-medium
                                  ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </div>
                              <p className="text-gray-400 text-xs">
                                ID: #{booking._id.slice(-8).toUpperCase()}
                              </p>
                            </div>
                            <span className="text-secondary font-bold text-xl">
                              ₹{booking.price}
                            </span>
                          </div>

                          {/* Customer + Worker Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2
                            gap-3 mb-4">
                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-blue-400 text-xs mb-1
                                font-medium">
                                👤 CUSTOMER
                              </p>
                              <p className="font-bold text-gray-800">
                                {booking.customer?.name || 'N/A'}
                              </p>
                              <p className="text-gray-500 text-sm">
                                {booking.customer?.email}
                              </p>
                              <p className="text-gray-500 text-sm">
                                📱 {booking.customer?.phone}
                              </p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-3">
                              <p className="text-purple-400 text-xs mb-1
                                font-medium">
                                👷 WORKER
                              </p>
                              {booking.assignedWorker ? (
                                <>
                                  <p className="font-bold text-gray-800">
                                    {booking.assignedWorker?.name}
                                  </p>
                                  <p className="text-gray-500 text-sm">
                                    📱 {booking.assignedWorker?.phone}
                                  </p>
                                </>
                              ) : (
                                <p className="text-gray-400 text-sm
                                  italic">
                                  Worker assign nahi hua abhi
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">
                                Date
                              </p>
                              <p className="font-medium text-gray-700 text-sm">
                                📅 {booking.date}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">
                                Time
                              </p>
                              <p className="font-medium text-gray-700 text-sm">
                                ⏰ {booking.time}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">
                                Created
                              </p>
                              <p className="font-medium text-gray-700 text-sm">
                                🗓️ {new Date(booking.createdAt)
                                  .toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3
                              col-span-3">
                              <p className="text-gray-400 text-xs mb-1">
                                Address
                              </p>
                              <p className="font-medium text-gray-700 text-sm">
                                📍 {booking.address}
                              </p>
                            </div>
                          </div>

                          {/* Status Change */}
                          <div className="flex items-center gap-3">
                            <label className="text-gray-500 text-sm
                              font-medium">
                              Status Change:
                            </label>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleStatusChange(
                                    booking._id,
                                    e.target.value
                                  );
                                }
                              }}
                              value={booking.status}
                              disabled={
                                actionLoading === booking._id + '_status'
                              }
                              className="border border-gray-200 rounded-xl
                                px-3 py-2 text-sm outline-none
                                focus:border-primary transition
                                disabled:opacity-60 cursor-pointer"
                            >
                              <option value="Searching">🔍 Searching</option>
                              <option value="Confirmed">✅ Confirmed</option>
                              <option value="Completed">🎉 Completed</option>
                              <option value="Cancelled">❌ Cancelled</option>
                              <option value="No Workers">😔 No Workers</option>
                            </select>
                            {actionLoading === booking._id + '_status' && (
                              <span className="text-gray-400 text-sm">
                                ⏳ Updating...
                              </span>
                            )}
                          </div>

                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;