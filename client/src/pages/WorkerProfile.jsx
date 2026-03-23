import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

function WorkerProfile() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorker = useCallback(async () => {
    try {
      const response = await axios.get(
        `/worker/${workerId}`
      );
      if (response.data.success) {
        setWorker(response.data.worker);
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  const handleBookNow = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Pehle Login Karo!');
      navigate('/login');
      return;
    }
    navigate(`/booking/${worker.service}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">⏳ Loading...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">😕 Worker nahi mila!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">

          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-indigo-800 p-8 text-white">
            <div className="flex items-center gap-6">

              {/* Avatar */}
              <div className="w-24 h-24 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-4xl">
                {worker.service === 'Plumber' ? '🔧' :
                 worker.service === 'Electrician' ? '⚡' :
                 worker.service === 'Carpenter' ? '🪚' :
                 worker.service === 'Painter' ? '🎨' :
                 worker.service === 'AC Mechanic' ? '❄️' :
                 worker.service === 'Cleaner' ? '🧹' : '👷'}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {worker.name}
                  </h1>
                  {worker.isVerified && (
                    <span className="bg-green-400 text-white text-xs px-2 py-1 rounded-full">
                      ✅ Verified
                    </span>
                  )}
                </div>
                <p className="text-indigo-200 mt-1">
                  {worker.service}
                </p>
                <p className="text-indigo-200">
                  📍 {worker.city || 'City not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-6 border-b">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary">
                ⭐ {worker.rating || '0'}
              </h3>
              <p className="text-gray-500 text-sm">Rating</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary">
                {worker.totalReviews || '0'}
              </h3>
              <p className="text-gray-500 text-sm">Reviews</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-secondary">
                ₹{worker.price || '200'}
              </h3>
              <p className="text-gray-500 text-sm">Per Visit</p>
            </div>
          </div>

          {/* Details */}
          <div className="p-6">

            {/* About */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                👨‍🔧 About
              </h2>
              <p className="text-gray-600">
                {worker.about ||
                  `Professional ${worker.service} with years of experience!`
                }
              </p>
            </div>

            {/* Experience */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                💼 Experience
              </h2>
              <p className="text-gray-600">
                {worker.experience || '2+ Years'}
              </p>
            </div>

            {/* Contact */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                📞 Contact
              </h2>
              <p className="text-gray-600">
                📱 {worker.phone}
              </p>
              <p className="text-gray-600 mt-1">
                📧 {worker.email}
              </p>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBookNow}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition"
            >
              🔧 Abhi Book Karo - ₹{worker.price || '200'}
            </button>

          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-primary font-medium hover:underline"
        >
          ← Wapas Jao
        </button>

      </div>
    </div>
  );
}

export default WorkerProfile;