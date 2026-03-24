import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

function Review() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [booking, setBooking] = useState(null);

  // Booking fetch karo worker id ke liye
  const fetchBooking = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/booking/single/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        setBooking(response.data.booking);
      }
    } catch (error) {
      console.log('Error fetching booking:', error);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (rating === 0) {
      setError('Rating dena zaroori hai!');
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(
        localStorage.getItem('user')
      );
      const token = localStorage.getItem('token');

      const response = await axios.post(
        '/review/add',
        {
          booking: bookingId,
          customer: user.id,
          worker: booking?.worker || user.id,
          rating,
          comment,
          service: booking?.service || 'Service'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Review Submit Ho Gaya! ⭐');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
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
            ⭐ Review Do
          </h1>
          <p className="text-indigo-200">
            Apna experience share karo!
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

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-3">
                Rating Do:
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-4xl transition"
                  >
                    {star <= (hoveredRating || rating)
                      ? '⭐'
                      : '☆'}
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-gray-500 mt-2">
                  {rating === 1 && '😞 Bahut Bura'}
                  {rating === 2 && '😐 Theek Tha'}
                  {rating === 3 && '🙂 Accha Tha'}
                  {rating === 4 && '😊 Bahut Accha'}
                  {rating === 5 && '🤩 Zabardast!'}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                📝 Apna Experience Likho:
              </label>
              <textarea
                placeholder="Worker ka kaam kaisa tha? Detail mein likho..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows="4"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Baad Mein
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                {loading ? 'Submit Ho Raha Hai...' : 'Submit Karo ⭐'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default Review;