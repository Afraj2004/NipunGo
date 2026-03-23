import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // User check karo
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!savedUser || !token) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(savedUser));
    fetchBookings(token);
  }, []);

  const fetchBookings = async (token) => {
    try {
      const response = await axios.get(
        '/booking/all',
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

  // Status color
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-indigo-800 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">
            👋 Welcome, {user?.name}!
          </h1>
          <p className="text-indigo-200">
            Apni bookings yahan dekho
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
              <h3 className="text-2xl font-bold">
                {bookings.length}
              </h3>
              <p className="text-indigo-200 text-sm">
                Total Bookings
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
              <h3 className="text-2xl font-bold">
                {bookings.filter(b => 
                  b.status === 'Pending'
                ).length}
              </h3>
              <p className="text-indigo-200 text-sm">
                Pending
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
              <h3 className="text-2xl font-bold">
                {bookings.filter(b => 
                  b.status === 'Completed'
                ).length}
              </h3>
              <p className="text-indigo-200 text-sm">
                Completed
              </p>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Meri Bookings
          </h2>

          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-xl">
                Loading... ⏳
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-gray-500 text-xl">
                Koi booking nahi hai!
              </p>
              <button
                onClick={() => navigate('/services')}
                className="mt-4 bg-primary text-white px-6 py-2 rounded-full"
              >
                Book Karo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    {/* Service Info */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {booking.service}
                      </h3>
                      <p className="text-gray-500 mt-1">
                        📅 {booking.date} | ⏰ {booking.time}
                      </p>
                      <p className="text-gray-500 mt-1">
                        📍 {booking.address}
                      </p>
                      <p className="text-secondary font-bold mt-2">
                        ₹{booking.price}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
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