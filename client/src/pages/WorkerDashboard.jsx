// client/src/pages/WorkerDashboard.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

function WorkerDashboard() {
  const navigate = useNavigate();

  // ── Core States ───────────────────────────────────────
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myBookings, setMyBookings]           = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [user, setUser]                       = useState(null);
  const [activeTab, setActiveTab]             = useState('requests');
  const [isAvailable, setIsAvailable]         = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [actionLoading, setActionLoading]     = useState('');

  // ── Profile States ────────────────────────────────────
  const [profileData, setProfileData] = useState({
    service:    '',
    city:       '',
    price:      '',
    experience: '',
    about:      '',
  });
  const [profileLoading, setProfileLoading]   = useState(false);
  const [profileSuccess, setProfileSuccess]   = useState('');
  const [profileError, setProfileError]       = useState('');

  // ── Photo States ──────────────────────────────────────
  const [photoFile, setPhotoFile]             = useState(null);
  const [photoPreview, setPhotoPreview]       = useState('');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [photoLoading, setPhotoLoading]       = useState(false);
  const [photoSuccess, setPhotoSuccess]       = useState('');
  const [photoError, setPhotoError]           = useState('');
  const fileInputRef                          = useRef(null);

  // ── Polling Refs ──────────────────────────────────────
  const pollingRef = useRef(null);
  const userRef    = useRef(null);

  // ─────────────────────────────────────────────────────
  // ── Fetch Functions ───────────────────────────────────
  // ─────────────────────────────────────────────────────

  const fetchPendingRequests = useCallback(async (workerId, token) => {
    try {
      const res = await axios.get(`/booking/worker-requests/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setPendingRequests(res.data.requests);
    } catch (err) {
      console.log('Requests fetch error:', err);
    }
  }, []);

  const fetchMyBookings = useCallback(async (workerId, token) => {
    try {
      const res = await axios.get(`/booking/worker-bookings/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setMyBookings(res.data.bookings);
    } catch (err) {
      console.log('Bookings fetch error:', err);
    }
  }, []);

  const fetchAllData = useCallback(
    async (workerId, token) => {
      setLoading(true);
      await Promise.all([
        fetchPendingRequests(workerId, token),
        fetchMyBookings(workerId, token),
      ]);
      setLoading(false);
    },
    [fetchPendingRequests, fetchMyBookings]
  );

  // ── Worker Profile ────────────────────────────────────
  const fetchWorkerProfile = useCallback(async (workerId) => {
    try {
      const res = await axios.get(`/worker/${workerId}`);
      if (res.data.success) {
        const w = res.data.worker;
        setIsAvailable(w.isAvailable ?? true);
        setCurrentPhotoUrl(w.photoUrl || '');
        setProfileData({
          service:    w.service    || '',
          city:       w.city       || '',
          price:      w.price      || '',
          experience: w.experience || '',
          about:      w.about      || '',
        });
      }
    } catch (err) {
      console.log('Profile fetch error:', err);
    }
  }, []);

  // ─────────────────────────────────────────────────────
  // ── Auth + Init ───────────────────────────────────────
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token     = localStorage.getItem('token');

    if (!savedUser || !token) { navigate('/login'); return; }

    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.role !== 'worker') { navigate('/dashboard'); return; }

    setUser(parsedUser);
    userRef.current = parsedUser;

    fetchAllData(parsedUser.id, token);
    fetchWorkerProfile(parsedUser.id);

    // ── Polling every 8 sec ───────────────────────────
    pollingRef.current = setInterval(() => {
      const tkn = localStorage.getItem('token');
      if (userRef.current && tkn)
        fetchPendingRequests(userRef.current.id, tkn);
    }, 8000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [navigate, fetchAllData, fetchPendingRequests, fetchWorkerProfile]);

  // ─────────────────────────────────────────────────────
  // ── Action Handlers ───────────────────────────────────
  // ─────────────────────────────────────────────────────

  // ── Accept ────────────────────────────────────────────
  const handleAccept = async (bookingId) => {
    setActionLoading(bookingId + '_accept');
    try {
      const token = localStorage.getItem('token');
      const res   = await axios.put(
        `/booking/accept/${bookingId}`,
        { workerId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setPendingRequests(prev => prev.filter(r => r._id !== bookingId));
        setMyBookings(prev => [res.data.booking, ...prev]);
        setActiveTab('bookings');
        alert('Booking Accept Ho Gayi! Kaam shuru karo! 🎉');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Kuch galat hua!');
      fetchPendingRequests(user.id, localStorage.getItem('token'));
    } finally {
      setActionLoading('');
    }
  };

  // ── Reject ────────────────────────────────────────────
  const handleReject = async (bookingId) => {
    if (!window.confirm('Is request ko reject karna chahte ho?')) return;
    setActionLoading(bookingId + '_reject');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/booking/reject/${bookingId}`,
        { workerId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingRequests(prev => prev.filter(r => r._id !== bookingId));
    } catch {
      alert('Kuch galat hua!');
    } finally {
      setActionLoading('');
    }
  };

  // ── Complete ──────────────────────────────────────────
  const handleComplete = async (bookingId) => {
    if (!window.confirm('Kaam complete ho gaya?')) return;
    setActionLoading(bookingId + '_complete');
    try {
      const token = localStorage.getItem('token');
      const res   = await axios.put(
        `/booking/complete/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMyBookings(prev =>
          prev.map(b => b._id === bookingId ? { ...b, status: 'Completed' } : b)
        );
        alert('Bahut badhiya! Kaam complete ho gaya! 🌟');
      }
    } catch {
      alert('Kuch galat hua!');
    } finally {
      setActionLoading('');
    }
  };

  // ── Availability Toggle ───────────────────────────────
  const handleAvailabilityToggle = async () => {
    setAvailabilityLoading(true);
    try {
      const newStatus = !isAvailable;
      await axios.put(`/worker/availability/${user.id}`, {
        isAvailable: newStatus,
      });
      setIsAvailable(newStatus);
    } catch {
      alert('Availability update nahi ho saki!');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // ── Profile Handlers ──────────────────────────────────
  // ─────────────────────────────────────────────────────

  // ── Text Input Change ─────────────────────────────────
  const handleProfileChange = (e) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileError('');
    setProfileSuccess('');
  };

  // ── Profile Save ──────────────────────────────────────
  const handleProfileSave = async () => {
    // Basic validation
    if (!profileData.service.trim()) {
      setProfileError('Service select karna zaroori hai!');
      return;
    }
    if (profileData.price && (isNaN(profileData.price) || profileData.price < 0)) {
      setProfileError('Valid price daalo!');
      return;
    }

    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await axios.put(`/worker/update/${user.id}`, profileData);
      if (res.data.success) {
        setProfileSuccess('Profile update ho gaya! 👍');
        // localStorage mein bhi update karo
        const updatedUser = { ...user, ...res.data.worker };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Profile update nahi ho saka!');
    } finally {
      setProfileLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // ── Photo Handlers ────────────────────────────────────
  // ─────────────────────────────────────────────────────

  // ── File Select ───────────────────────────────────────
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side type check
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setPhotoError('Sirf JPG, PNG, WEBP images allowed hain!');
      return;
    }
    // Client-side size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo 5MB se chhoti honi chahiye!');
      return;
    }

    setPhotoFile(file);
    setPhotoError('');
    setPhotoSuccess('');

    // Preview banana ke liye FileReader
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Photo Upload ──────────────────────────────────────
  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setPhotoError('Pehle photo select karo!');
      return;
    }

    setPhotoLoading(true);
    setPhotoError('');
    setPhotoSuccess('');

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const res = await axios.put(
        `/worker/upload-photo/${user.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (res.data.success) {
        setCurrentPhotoUrl(res.data.photoUrl);
        setPhotoPreview('');
        setPhotoFile(null);
        setPhotoSuccess('Photo upload ho gayi! 📸');

        // localStorage update
        const updatedUser = { ...user, photoUrl: res.data.photoUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        // file input reset
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setPhotoSuccess(''), 3000);
      }
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Photo upload nahi ho saki!');
    } finally {
      setPhotoLoading(false);
    }
  };

  // ── Photo Delete ──────────────────────────────────────
  const handlePhotoDelete = async () => {
    if (!window.confirm('Photo delete karna chahte ho?')) return;

    setPhotoLoading(true);
    setPhotoError('');
    setPhotoSuccess('');

    try {
      const res = await axios.delete(`/worker/delete-photo/${user.id}`);
      if (res.data.success) {
        setCurrentPhotoUrl('');
        setPhotoPreview('');
        setPhotoFile(null);
        setPhotoSuccess('Photo delete ho gayi!');

        const updatedUser = { ...user, photoUrl: '' };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setPhotoSuccess(''), 3000);
      }
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Photo delete nahi ho saki!');
    } finally {
      setPhotoLoading(false);
    }
  };

  // ── Cancel Photo Select ───────────────────────────────
  const handleCancelPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─────────────────────────────────────────────────────
  // ── Stats ─────────────────────────────────────────────
  // ─────────────────────────────────────────────────────
  const stats = {
    newRequests: pendingRequests.length,
    confirmed:   myBookings.filter(b => b.status === 'Confirmed').length,
    completed:   myBookings.filter(b => b.status === 'Completed').length,
    earnings:    myBookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + (b.price || 0), 0),
  };

  const getStatusColor = (status) => ({
    'Searching': 'bg-yellow-100 text-yellow-600 border border-yellow-200',
    'Confirmed': 'bg-blue-100   text-blue-600   border border-blue-200',
    'Completed': 'bg-green-100  text-green-600  border border-green-200',
    'Cancelled': 'bg-red-100    text-red-600    border border-red-200',
  }[status] || 'bg-gray-100 text-gray-600');

  // Service options — booking page ke saath match karein
  const serviceOptions = [
    'Plumber', 'Electrician', 'Carpenter',
    'Painter', 'Cleaner', 'AC Repair',
    'Appliance Repair', 'Pest Control',
  ];

  // ─────────────────────────────────────────────────────
  // ── Loading Screen ────────────────────────────────────
  // ─────────────────────────────────────────────────────
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
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // ── Main Render ───────────────────────────────────────
  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-gray-800 via-gray-900 to-black
        pt-10 pb-24 px-4 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary
          opacity-10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto relative z-10">

          {/* Worker Badge + Availability Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-block bg-primary bg-opacity-20 text-primary
              px-4 py-1 rounded-full text-sm font-medium border border-primary
              border-opacity-30">
              👷 Worker Dashboard
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAvailabilityToggle}
              disabled={availabilityLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-full
                text-sm font-bold transition ${
                isAvailable
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                isAvailable ? 'bg-white animate-pulse' : 'bg-gray-300'
              }`} />
              {availabilityLoading
                ? '...'
                : isAvailable ? 'Available ✅' : 'Unavailable ⏸️'
              }
            </motion.button>
          </div>

          {/* User Info — Profile Photo + Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            {/* Avatar */}
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt={user?.name}
                className="w-16 h-16 rounded-2xl object-cover border-2
                  border-white border-opacity-30"
              />
            ) : (
              <div className="w-16 h-16 bg-white bg-opacity-10 rounded-2xl
                flex items-center justify-center text-white font-bold text-2xl
                border border-white border-opacity-20">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <p className="text-gray-400 text-sm">
                👷 {profileData.service || 'Professional Worker'}
              </p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'New Requests', value: stats.newRequests,     icon: '🔔', pulse: stats.newRequests > 0 },
              { label: 'Confirmed',    value: stats.confirmed,        icon: '📋', pulse: false },
              { label: 'Completed',    value: stats.completed,        icon: '✅', pulse: false },
              { label: 'Total Earnings',value: `₹${stats.earnings}`,  icon: '💰', pulse: false },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl
                  p-4 border border-white border-opacity-10"
              >
                <div className={`text-2xl mb-2 ${stat.pulse ? 'animate-bounce' : ''}`}>
                  {stat.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 pb-12">

        {/* New Request Alert */}
        <AnimatePresence>
          {stats.newRequests > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl
                p-4 mb-6 flex items-center gap-3"
            >
              <div className="text-2xl animate-bounce">🔔</div>
              <div>
                <p className="font-bold text-yellow-700">
                  {stats.newRequests} Nai Booking Request
                  {stats.newRequests > 1 ? 'ein' : ''}!
                </p>
                <p className="text-yellow-600 text-sm">
                  Jaldi accept karo — pehle aao pehle pao! ⚡
                </p>
              </div>
              <button
                onClick={() => setActiveTab('requests')}
                className="ml-auto bg-yellow-400 text-white px-4 py-2
                  rounded-xl text-sm font-bold hover:bg-yellow-500 transition"
              >
                Dekho →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unavailable Warning */}
        <AnimatePresence>
          {!isAvailable && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-gray-100 border border-gray-300 rounded-2xl p-4
                mb-6 flex items-center gap-3"
            >
              <span className="text-2xl">⏸️</span>
              <div>
                <p className="font-bold text-gray-700">Aap Unavailable Hain</p>
                <p className="text-gray-500 text-sm">
                  Nai requests nahi aayengi. Available karo upar se.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >

          {/* ── Tabs ─────────────────────────────────── */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'requests', label: '🔔 New Requests', count: stats.newRequests },
                { id: 'bookings', label: '📋 My Bookings',  count: myBookings.length },
                { id: 'profile',  label: '👤 My Profile',   count: null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-2.5
                    rounded-xl text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}

                  {/* Count Badge */}
                  {tab.count !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}

                  {/* Red ping for new requests */}
                  {tab.id === 'requests' && stats.newRequests > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3
                      bg-red-500 rounded-full animate-ping" />
                  )}
                </button>
              ))}

              {/* Manual Refresh */}
              <button
                onClick={() =>
                  fetchAllData(user.id, localStorage.getItem('token'))
                }
                className="ml-auto p-2.5 bg-gray-100 text-gray-600
                  rounded-xl hover:bg-gray-200 transition text-sm"
                title="Refresh"
              >
                🔄
              </button>
            </div>
          </div>

          {/* ── Tab Content ──────────────────────────── */}
          <div className="p-6">
            <AnimatePresence mode="wait">

              {/* ══════════════════════════════════════════
                  TAB 1 : PENDING REQUESTS
              ══════════════════════════════════════════ */}
              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-gray-500 text-lg font-medium">
                        Abhi koi nai request nahi!
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Jab customer book karega, yahan dikhega.
                        Auto-refresh chal raha hai! 🔄
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {pendingRequests.map((request, index) => (
                        <motion.div
                          key={request._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-2 border-yellow-200 bg-yellow-50
                            rounded-2xl p-5"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between
                            flex-wrap gap-3 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-800 text-lg">
                                  {request.service}
                                </h3>
                                <span className="bg-yellow-100 text-yellow-600
                                  border border-yellow-200 px-3 py-1
                                  rounded-full text-xs font-medium">
                                  🔔 New Request
                                </span>
                              </div>
                              <p className="text-gray-500 text-sm">
                                ID: #{request._id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                            <span className="text-secondary font-bold text-xl">
                              ₹{request.price}
                            </span>
                          </div>

                          {/* Customer Info */}
                          <div className="bg-white rounded-xl p-4 mb-4
                            flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full
                              flex items-center justify-center text-primary
                              font-bold text-lg flex-shrink-0">
                              {request.customer?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {request.customer?.name}
                              </p>
                              <p className="text-gray-500 text-sm">
                                📱 {request.customer?.phone}
                              </p>
                              <p className="text-gray-500 text-sm">
                                📧 {request.customer?.email}
                              </p>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">Date</p>
                              <p className="font-medium text-gray-800 text-sm">
                                📅 {request.date}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">Time</p>
                              <p className="font-medium text-gray-800 text-sm">
                                ⏰ {request.time}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-3 col-span-2">
                              <p className="text-gray-400 text-xs mb-1">
                                Address
                              </p>
                              <p className="font-medium text-gray-800 text-sm">
                                📍 {request.address}
                              </p>
                            </div>
                            {request.description && (
                              <div className="bg-white rounded-xl p-3 col-span-2">
                                <p className="text-gray-400 text-xs mb-1">
                                  Problem
                                </p>
                                <p className="font-medium text-gray-800 text-sm">
                                  📝 {request.description}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Urgency Banner */}
                          <div className="bg-yellow-100 rounded-xl p-3 mb-4
                            flex items-center gap-2">
                            <span className="text-yellow-600 text-sm">⚡</span>
                            <p className="text-yellow-700 text-sm font-medium">
                              Jaldi karo! Doosre workers bhi yeh request dekh
                              rahe hain
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleReject(request._id)}
                              disabled={
                                actionLoading === request._id + '_reject'
                              }
                              className="flex-1 bg-red-50 text-red-500 border
                                border-red-200 py-3 rounded-xl font-bold
                                hover:bg-red-100 transition
                                disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {actionLoading === request._id + '_reject'
                                ? '...' : '❌ Reject'}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAccept(request._id)}
                              disabled={
                                actionLoading === request._id + '_accept'
                              }
                              className="flex-2 flex-grow-[2] bg-green-500
                                text-white py-3 rounded-xl font-bold
                                hover:bg-green-600 transition shadow-lg
                                shadow-green-200
                                disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {actionLoading === request._id + '_accept' ? (
                                <span className="flex items-center
                                  justify-center gap-2">
                                  <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{
                                      repeat: Infinity, duration: 1
                                    }}
                                  >⏳</motion.span>
                                  Accepting...
                                </span>
                              ) : '✅ Accept Karo'}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════
                  TAB 2 : MY BOOKINGS
              ══════════════════════════════════════════ */}
              {activeTab === 'bookings' && (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {myBookings.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-gray-500 text-lg font-medium">
                        Abhi koi booking nahi!
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Requests accept karne ke baad yahan dikhegi.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {myBookings.map((booking, index) => (
                        <motion.div
                          key={booking._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border border-gray-100 rounded-2xl p-5
                            hover:shadow-md transition-all"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between
                            flex-wrap gap-3 mb-4">
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
                              <p className="text-gray-500 text-sm">
                                ID: #{booking._id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                            <span className="text-secondary font-bold text-xl">
                              ₹{booking.price}
                            </span>
                          </div>

                          {/* Customer Info */}
                          <div className="bg-gray-50 rounded-xl p-4 mb-4
                            flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full
                              flex items-center justify-center text-primary
                              font-bold">
                              {booking.customer?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {booking.customer?.name}
                              </p>
                              <a
                                href={`tel:${booking.customer?.phone}`}
                                className="text-primary text-sm font-medium
                                  flex items-center gap-1 hover:underline"
                              >
                                📱 {booking.customer?.phone}
                              </a>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">Date</p>
                              <p className="font-medium text-gray-800 text-sm">
                                📅 {booking.date}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-1">Time</p>
                              <p className="font-medium text-gray-800 text-sm">
                                ⏰ {booking.time}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3
                              col-span-2">
                              <p className="text-gray-400 text-xs mb-1">
                                Address
                              </p>
                              <p className="font-medium text-gray-800 text-sm">
                                📍 {booking.address}
                              </p>
                            </div>
                            {booking.description && (
                              <div className="bg-gray-50 rounded-xl p-3
                                col-span-2">
                                <p className="text-gray-400 text-xs mb-1">
                                  Problem
                                </p>
                                <p className="font-medium text-gray-800 text-sm">
                                  📝 {booking.description}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            {booking.status === 'Confirmed' && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleComplete(booking._id)}
                                disabled={
                                  actionLoading === booking._id + '_complete'
                                }
                                className="flex-1 bg-primary text-white py-3
                                  rounded-xl font-bold hover:bg-indigo-700
                                  transition shadow-lg shadow-indigo-200
                                  disabled:opacity-60"
                              >
                                {actionLoading === booking._id + '_complete'
                                  ? '⏳ Updating...'
                                  : '🎉 Mark as Complete'
                                }
                              </motion.button>
                            )}
                            {booking.status === 'Completed' && (
                              <div className="flex-1 bg-green-50 text-green-600
                                border border-green-200 py-3 rounded-xl
                                font-bold text-center">
                                ✅ Completed
                              </div>
                            )}
                            {booking.status === 'Cancelled' && (
                              <div className="flex-1 bg-red-50 text-red-400
                                border border-red-200 py-3 rounded-xl
                                font-bold text-center">
                                ❌ Cancelled
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════
                  TAB 3 : MY PROFILE  ← NEW
              ══════════════════════════════════════════ */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                >

                  {/* ── SECTION A : Photo Upload ───────── */}
                  <div className="border border-gray-100 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex
                      items-center gap-2">
                      📸 Profile Photo
                    </h2>

                    {/* Current / Preview Photo */}
                    <div className="flex flex-col items-center mb-6">
                      {photoPreview ? (
                        /* New photo preview */
                        <div className="relative mb-3">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-32 h-32 rounded-2xl object-cover
                              border-4 border-primary border-opacity-40
                              shadow-lg"
                          />
                          <span className="absolute -top-2 -right-2
                            bg-primary text-white text-xs px-2 py-1
                            rounded-full">
                            Preview
                          </span>
                        </div>
                      ) : currentPhotoUrl ? (
                        /* Existing Cloudinary photo */
                        <div className="relative mb-3">
                          <img
                            src={currentPhotoUrl}
                            alt={user?.name}
                            className="w-32 h-32 rounded-2xl object-cover
                              border-4 border-gray-100 shadow-lg"
                          />
                          <span className="absolute -bottom-2 -right-2
                            bg-green-500 text-white text-xs px-2 py-1
                            rounded-full">
                            ✅ Active
                          </span>
                        </div>
                      ) : (
                        /* Placeholder avatar */
                        <div className="w-32 h-32 bg-gray-100 rounded-2xl
                          flex items-center justify-center text-gray-400
                          text-5xl font-bold border-4 border-dashed
                          border-gray-200 mb-3">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <p className="text-gray-400 text-xs text-center mt-1">
                        JPG, PNG, WEBP • Max 5MB • 400×400px crop
                      </p>
                    </div>

                    {/* File Input */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200
                        rounded-xl p-6 text-center cursor-pointer
                        hover:border-primary hover:bg-indigo-50 transition
                        mb-4"
                    >
                      <div className="text-3xl mb-2">📁</div>
                      <p className="text-gray-600 font-medium text-sm">
                        {photoFile
                          ? `✅ ${photoFile.name}`
                          : 'Click karo aur photo choose karo'
                        }
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        ya yahan drag & drop karo
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Photo Error / Success */}
                    {photoError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600
                          rounded-xl px-4 py-3 text-sm mb-4"
                      >
                        ❌ {photoError}
                      </motion.div>
                    )}
                    {photoSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200
                          text-green-600 rounded-xl px-4 py-3 text-sm mb-4"
                      >
                        {photoSuccess}
                      </motion.div>
                    )}

                    {/* Photo Action Buttons */}
                    <div className="flex gap-3 flex-wrap">
                      {/* Upload Button — tabhi show ho jab file select hui ho */}
                      {photoFile && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePhotoUpload}
                            disabled={photoLoading}
                            className="flex-1 bg-primary text-white py-3
                              rounded-xl font-bold hover:bg-indigo-700
                              transition disabled:opacity-60
                              disabled:cursor-not-allowed flex items-center
                              justify-center gap-2"
                          >
                            {photoLoading ? (
                              <>
                                <motion.span
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    repeat: Infinity, duration: 1
                                  }}
                                >⏳</motion.span>
                                Uploading...
                              </>
                            ) : '📤 Upload Photo'}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCancelPhoto}
                            className="px-5 py-3 bg-gray-100 text-gray-600
                              rounded-xl font-bold hover:bg-gray-200 transition"
                          >
                            Cancel
                          </motion.button>
                        </>
                      )}

                      {/* Delete Button — tabhi show ho jab photo exist kare */}
                      {currentPhotoUrl && !photoFile && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePhotoDelete}
                          disabled={photoLoading}
                          className="flex-1 bg-red-50 text-red-500 border
                            border-red-200 py-3 rounded-xl font-bold
                            hover:bg-red-100 transition
                            disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {photoLoading ? '⏳ Deleting...' : '🗑️ Photo Delete Karo'}
                        </motion.button>
                      )}

                      {/* Choose New button — jab photo already hai aur koi
                          file select nahi ki */}
                      {!photoFile && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => fileInputRef.current?.click()}
                          className={`py-3 px-6 rounded-xl font-bold
                            transition border ${
                            currentPhotoUrl
                              ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              : 'bg-primary text-white border-transparent hover:bg-indigo-700 flex-1'
                          }`}
                        >
                          {currentPhotoUrl ? '🔄 Change Photo' : '📷 Photo Choose Karo'}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* ── SECTION B : Profile Info ─────────── */}
                  <div className="border border-gray-100 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex
                      items-center gap-2">
                      ✏️ Profile Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Service */}
                      <div>
                        <label className="block text-sm font-medium
                          text-gray-600 mb-1.5">
                          Service Type *
                        </label>
                        <select
                          name="service"
                          value={profileData.service}
                          onChange={handleProfileChange}
                          className="w-full p-3 border border-gray-200
                            rounded-xl text-gray-800 focus:outline-none
                            focus:border-primary focus:ring-2
                            focus:ring-primary focus:ring-opacity-20
                            transition"
                        >
                          <option value="">Service select karo</option>
                          {serviceOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-sm font-medium
                          text-gray-600 mb-1.5">
                          Price per Hour (₹)
                        </label>
                        <input
                          type="number"
                          name="price"
                          min="0"
                          placeholder="jaise: 500"
                          value={profileData.price}
                          onChange={handleProfileChange}
                          className="w-full p-3 border border-gray-200
                            rounded-xl text-gray-800 focus:outline-none
                            focus:border-primary focus:ring-2
                            focus:ring-primary focus:ring-opacity-20
                            transition"
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-sm font-medium
                          text-gray-600 mb-1.5">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          placeholder="jaise: Delhi, Mumbai"
                          value={profileData.city}
                          onChange={handleProfileChange}
                          className="w-full p-3 border border-gray-200
                            rounded-xl text-gray-800 focus:outline-none
                            focus:border-primary focus:ring-2
                            focus:ring-primary focus:ring-opacity-20
                            transition"
                        />
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="block text-sm font-medium
                          text-gray-600 mb-1.5">
                          Experience
                        </label>
                        <input
                          type="text"
                          name="experience"
                          placeholder="jaise: 5 saal ka experience"
                          value={profileData.experience}
                          onChange={handleProfileChange}
                          className="w-full p-3 border border-gray-200
                            rounded-xl text-gray-800 focus:outline-none
                            focus:border-primary focus:ring-2
                            focus:ring-primary focus:ring-opacity-20
                            transition"
                        />
                      </div>

                      {/* About */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium
                          text-gray-600 mb-1.5">
                          About Yourself
                        </label>
                        <textarea
                          name="about"
                          rows={4}
                          placeholder="Apne baare mein likho — specialization, skills, etc."
                          value={profileData.about}
                          onChange={handleProfileChange}
                          className="w-full p-3 border border-gray-200
                            rounded-xl text-gray-800 focus:outline-none
                            focus:border-primary focus:ring-2
                            focus:ring-primary focus:ring-opacity-20
                            transition resize-none"
                        />
                      </div>
                    </div>

                    {/* Profile Error / Success */}
                    {profileError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600
                          rounded-xl px-4 py-3 text-sm mt-4"
                      >
                        ❌ {profileError}
                      </motion.div>
                    )}
                    {profileSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200
                          text-green-600 rounded-xl px-4 py-3 text-sm mt-4"
                      >
                        {profileSuccess}
                      </motion.div>
                    )}

                    {/* Save Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleProfileSave}
                      disabled={profileLoading}
                      className="w-full mt-5 bg-gray-900 text-white py-3.5
                        rounded-xl font-bold hover:bg-gray-700 transition
                        disabled:opacity-60 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2"
                    >
                      {profileLoading ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >⏳</motion.span>
                          Saving...
                        </>
                      ) : '💾 Save Changes'}
                    </motion.button>
                  </div>

                  {/* ── SECTION C : Account Info (Read-only) ─ */}
                  <div className="border border-gray-100 rounded-2xl p-6
                    bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex
                      items-center gap-2">
                      🔒 Account Info
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name',  value: user?.name,  icon: '👤' },
                        { label: 'Email',      value: user?.email, icon: '📧' },
                        { label: 'Phone',      value: user?.phone, icon: '📱' },
                        { label: 'Role',       value: 'Worker',    icon: '🏷️' },
                      ].map((item) => (
                        <div key={item.label}
                          className="bg-white rounded-xl p-3 border
                            border-gray-100">
                          <p className="text-gray-400 text-xs mb-1">
                            {item.label}
                          </p>
                          <p className="text-gray-800 font-medium text-sm">
                            {item.icon} {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs mt-4 text-center">
                      Name / Email / Phone change karne ke liye support se
                      contact karein.
                    </p>
                  </div>

                </motion.div>
              )}
              {/* ══════════════ END PROFILE TAB ══════════ */}

            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default WorkerDashboard;