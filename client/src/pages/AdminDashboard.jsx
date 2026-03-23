import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admin check karo
    const user = JSON.parse(
      localStorage.getItem('user')
    );
    if (!user || user.email !== 'admin@nipungo.com') {
      alert('Admin Only! 🔒');
      navigate('/');
      return;
    }
    fetchStats();
    fetchUsers();
    fetchBookings();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/admin/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/admin/bookings');
      if (response.data.success) {
        setBookings(response.data.bookings);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const handleVerifyWorker = async (workerId) => {
    try {
      const response = await axios.put(
        `/admin/verify-worker/${workerId}`
      );
      if (response.data.success) {
        alert('Worker Verify Ho Gaya! ✅');
        fetchUsers();
      }
    } catch (error) {
      alert('Kuch galat hua!');
    }
  };

  const handleStatusChange = async (bookingId, status) => {
    try {
      const response = await axios.put(
        `/admin/booking-status/${bookingId}`,
        { status }
      );
      if (response.data.success) {
        alert(`Booking ${status} Ho Gayi!`);
        fetchBookings();
      }
    } catch (error) {
      alert('Kuch galat hua!');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Pakka delete karna hai?')) return;
    try {
      await axios.delete(`/admin/user/${userId}`);
      alert('User Delete Ho Gaya!');
      fetchUsers();
    } catch (error) {
      alert('Kuch galat hua!');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-600';
      case 'Confirmed': return 'bg-blue-100 text-blue-600';
      case 'Completed': return 'bg-green-100 text-green-600';
      case 'Cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">
            🔐 Admin Dashboard
          </h1>
          <p className="text-gray-400">
            NipunGo Control Panel
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 text-center shadow-md">
              <h3 className="text-2xl font-bold text-primary">
                {stats.totalUsers}
              </h3>
              <p className="text-gray-500 text-sm">👥 Users</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-md">
              <h3 className="text-2xl font-bold text-primary">
                {stats.totalWorkers}
              </h3>
              <p className="text-gray-500 text-sm">👷 Workers</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-md">
              <h3 className="text-2xl font-bold text-primary">
                {stats.totalBookings}
              </h3>
              <p className="text-gray-500 text-sm">📋 Total</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-md">
              <h3 className="text-2xl font-bold text-yellow-500">
                {stats.pendingBookings}
              </h3>
              <p className="text-gray-500 text-sm">⏳ Pending</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-md">
              <h3 className="text-2xl font-bold text-green-500">
                {stats.completedBookings}
              </h3>
              <p className="text-gray-500 text-sm">✅ Completed</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-md">
              <h3 className="text-2xl font-bold text-red-500">
                {stats.cancelledBookings}
              </h3>
              <p className="text-gray-500 text-sm">❌ Cancelled</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-full font-medium transition ${
              activeTab === 'users'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-6 py-2 rounded-full font-medium transition ${
              activeTab === 'workers'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            👷 Workers
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-2 rounded-full font-medium transition ${
              activeTab === 'bookings'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            📋 Bookings
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              👥 Sabhi Customers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(u => u.role === 'customer')
                    .map((user, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{user.name}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.phone}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Workers Tab */}
        {activeTab === 'workers' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              👷 Sabhi Workers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Service</th>
                    <th className="p-3 text-left">City</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(u => u.role === 'worker')
                    .map((worker, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{worker.name}</td>
                        <td className="p-3">{worker.service}</td>
                        <td className="p-3">{worker.city}</td>
                        <td className="p-3">
                          {worker.isVerified ? (
                            <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-sm">
                              ✅ Verified
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-sm">
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3 flex gap-2">
                          {!worker.isVerified && (
                            <button
                              onClick={() => handleVerifyWorker(worker._id)}
                              className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(worker._id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              📋 Sabhi Bookings
            </h2>
            <div className="flex flex-col gap-4">
              {bookings.map((booking, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {booking.service}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        👤 Customer: {booking.customer?.name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        📅 {booking.date} | ⏰ {booking.time}
                      </p>
                      <p className="text-gray-500 text-sm">
                        📍 {booking.address}
                      </p>
                      <p className="text-secondary font-bold mt-1">
                        ₹{booking.price}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium text-center ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>

                      {/* Status Change */}
                      <select
                        onChange={(e) => handleStatusChange(
                          booking._id,
                          e.target.value
                        )}
                        className="border rounded-lg px-2 py-1 text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Status Change
                        </option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;