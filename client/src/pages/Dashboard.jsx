import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
          headers: {
            Authorization: `Bearer ${token}`
          }
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
    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `/booking/cancel/${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Bookings refresh karo
        setBookings(bookings.map(booking =>
          booking._id === bookingId
            ? { ...booking, status: 'Cancelled' }
            : booking
        ));
        alert('Booking Cancel Ho Gayi! 😊');
      }

    } catch (error) {
      alert('Kuch galat hua!');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-600';
      case 'Completed':
        return 'bg-green-100 text-green-600';
      case 'Cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-indigo-800 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">
            👋 Welcome, {user?.name}!
          </h1>
          <p className="text-indigo-200">
            Apni bookings yahan manage karo
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
              <h3 className="text-2xl font-bold">
                {bookings.length}
              </h3>
              <p className="text-indigo-200 text-sm">
                Total
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
              <h3 className="text-2xl font-bold">
                {bookings.filter(b =>
                  b.status === 'Pending'
                ).length}
              </h3>
              <p className="text-indigo-200 text-sm">
                ⏳ Pending
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
              <h3 className="text-2xl font-bold">
                {bookings.filter(b =>
                  b.status === 'Confirmed'
                ).length}
              </h3>
              <p className="text-indigo-200 text-sm">
                ✅ Confirmed
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
              <h3 className="text-2xl font-bold">
                {bookings.filter(b =>
                  b.status === 'Completed'
                ).length}
              </h3>
              <p className="text-indigo-200 text-sm">
                🎉 Completed
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate('/services')}
            className="bg-primary text-white p-4 rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            🔧 New Booking Karo
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-secondary text-white p-4 rounded-xl font-bold hover:bg-orange-600 transition"
          >
            🏠 Home Par Jao
          </button>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Meri Bookings
          </h2>

          {loading ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-4">⏳</p>
              <p className="text-gray-500 text-xl">
                Loading...
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-gray-500 text-xl mb-4">
                Koi booking nahi hai!
              </p>
              <button
                onClick={() => navigate('/services')}
                className="bg-primary text-white px-6 py-3 rounded-full font-bold"
              >
                Pehli Booking Karo! 🚀
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start flex-wrap gap-4">

                    {/* Service Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {booking.service}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)} {booking.status}
                        </span>
                      </div>

                      <p className="text-gray-500 mt-1">
                        📅 {booking.date} | ⏰ {booking.time}
                      </p>
                      <p className="text-gray-500 mt-1">
                        📍 {booking.address}
                      </p>
                      {booking.description && (
                        <p className="text-gray-500 mt-1">
                          📝 {booking.description}
                        </p>
                      )}
                      <p className="text-secondary font-bold mt-2">
                        💰 ₹{booking.price}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {booking.status === 'Pending' && (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition"
                        >
                          ❌ Cancel Karo
                        </button>
                      )}
                      {booking.status === 'Completed' && (
                        <button
                          onClick={() => navigate(`/review/${booking._id}`)}
                          className="bg-yellow-400 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-500 transition"
                        >
                          ⭐ Review Do
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;