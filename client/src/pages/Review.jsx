import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

const ratingLabels = {
  1: { label: "Bahut Bura", emoji: "😞", color: "text-red-500" },
  2: { label: "Theek Tha", emoji: "😐", color: "text-orange-500" },
  3: { label: "Accha Tha", emoji: "🙂", color: "text-yellow-500" },
  4: { label: "Bahut Accha", emoji: "😊", color: "text-blue-500" },
  5: { label: "Zabardast!", emoji: "🤩", color: "text-green-500" },
};

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
  const [tags, setTags] = useState([]);

  const reviewTags = [
    "Professional", "On Time", "Clean Work",
    "Good Communication", "Value for Money",
    "Would Recommend", "Quick Service",
  ];

  const fetchBooking = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/booking/single/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setBooking(response.data.booking);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (rating === 0) {
      setError('Rating dena zaroori hai!');
      setLoading(false);
      return;
    }

    if (!comment.trim()) {
      setError('Review likhna zaroori hai!');
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      const finalComment = tags.length > 0
        ? `${comment}\n\nTags: ${tags.join(', ')}`
        : comment;

      const response = await axios.post(
        '/review/add',
        {
          booking: bookingId,
          customer: user.id,
          worker: booking?.worker || user.id,
          rating,
          comment: finalComment,
          service: booking?.service || 'Service'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Review Submit Ho Gaya! ⭐');
        setTimeout(() => navigate('/dashboard'), 2000);
      }

    } catch (error) {
      setError(
        error.response?.data?.message || 'Kuch galat hua!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            ⭐
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Review Do!
          </h1>
          <p className="text-gray-500">
            Apna experience share karo aur
            doosron ki madad karo
          </p>
        </motion.div>

        {/* Booking Info */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 mb-6 shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl">
              🔧
            </div>
            <div>
              <h3 className="font-bold text-gray-800">
                {booking.service}
              </h3>
              <p className="text-gray-400 text-sm">
                📅 {booking.date} | ⏰ {booking.time}
              </p>
            </div>
            <span className="ml-auto bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
              ✅ Completed
            </span>
          </motion.div>
        )}

        {/* ===== FORM ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm p-8"
        >

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2"
              >
                ⚠️ {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl mb-6 flex items-center gap-2 justify-center"
              >
                🎉 {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>

            {/* Star Rating */}
            <div className="mb-8">
              <label className="block text-gray-700 font-bold mb-4 text-center">
                Service kaisi thi?
              </label>

              {/* Stars */}
              <div className="flex gap-3 justify-center mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-5xl transition-all duration-150"
                  >
                    <motion.span
                      animate={{
                        scale: star <= (hoveredRating || rating)
                          ? 1.2 : 1,
                        filter: star <= (hoveredRating || rating)
                          ? 'brightness(1)'
                          : 'brightness(0.5) grayscale(100%)'
                      }}
                      className="block"
                    >
                      ⭐
                    </motion.span>
                  </motion.button>
                ))}
              </div>

              {/* Rating Label */}
              <AnimatePresence mode="wait">
                {(hoveredRating || rating) > 0 && (
                  <motion.div
                    key={hoveredRating || rating}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-center"
                  >
                    <span className="text-3xl">
                      {ratingLabels[hoveredRating || rating].emoji}
                    </span>
                    <p className={`font-bold mt-1 ${ratingLabels[hoveredRating || rating].color}`}>
                      {ratingLabels[hoveredRating || rating].label}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Tags */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-3">
                Tags Select Karo:
                <span className="text-gray-400 font-normal ml-1">
                  (Optional)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {reviewTags.map((tag) => (
                  <motion.button
                    key={tag}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      tags.includes(tag)
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
                    }`}
                  >
                    {tags.includes(tag) ? '✓ ' : ''}{tag}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-8">
              <label className="block text-gray-700 font-bold mb-2">
                📝 Apna Experience Likho:
              </label>
              <textarea
                placeholder="Worker ka kaam kaisa tha? Koi specific baat share karna chahte ho?..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100 transition resize-none"
              />
              <p className="text-gray-400 text-xs mt-1 text-right">
                {comment.length}/500 characters
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Baad Mein
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                {loading ? (
                  '⏳ Submit Ho Raha Hai...'
                ) : (
                  'Submit Review ⭐'
                )}
              </motion.button>
            </div>

          </form>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-indigo-50 rounded-2xl p-4 mt-4 text-center"
        >
          <p className="text-indigo-600 text-sm">
            💡 Tumhara review doosre customers
            ko sahi worker choose karne mein
            madad karta hai!
          </p>
        </motion.div>

      </div>
    </div>
  );
}

export default Review;