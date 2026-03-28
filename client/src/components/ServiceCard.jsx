import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// ── ServiceCard Component ──────────────────────────────────
// Usage:
// <ServiceCard service={serviceObject} viewMode="grid" />
// <ServiceCard service={serviceObject} viewMode="list" />

function ServiceCard({ service, viewMode = 'grid' }) {
  const navigate = useNavigate();

  const handleBookNow = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Pehle Login Karo! 😊');
      navigate('/login');
      return;
    }
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.role === 'worker') {
      alert('Workers booking nahi kar sakte!');
      return;
    }
    navigate(`/booking/${service.name}`);
  };

  // ── Grid View ────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="bg-white rounded-2xl shadow-md hover:shadow-xl
          transition-all duration-300 overflow-hidden group"
      >
        {/* Card Header */}
        <div className="bg-gradient-to-br from-indigo-50 to-white
          p-6 text-center relative">

          {/* Popular Badge */}
          {service.totalBookings > 300 && (
            <div className="absolute top-3 right-3 bg-secondary
              text-white text-xs px-2 py-1 rounded-full font-medium">
              🔥 Popular
            </div>
          )}

          <div className="text-5xl mb-3 group-hover:scale-110
            transition-transform duration-300">
            {service.icon}
          </div>
          <span className="bg-indigo-100 text-primary text-xs
            px-3 py-1 rounded-full font-medium">
            {service.category}
          </span>
        </div>

        {/* Card Body */}
        <div className="p-5">
          <h3 className="font-bold text-gray-800 text-lg mb-1">
            {service.name}
          </h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">
            {service.description}
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-sm">⭐</span>
              <span className="text-gray-700 text-sm font-medium">
                {service.rating}
              </span>
              <span className="text-gray-400 text-xs">
                ({service.totalBookings})
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <span>⏱️</span>
              <span>{service.time}</span>
            </div>
          </div>

          {/* Price & Button */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">
                Starting from
              </span>
              <p className="text-secondary font-bold text-xl">
                ₹{service.price}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookNow}
              className="bg-primary text-white px-4 py-2 rounded-xl
                font-medium text-sm hover:bg-indigo-700 transition
                shadow-md shadow-indigo-200"
            >
              Book Now
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── List View ────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 5 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg
        transition-all duration-300 p-5 flex items-center gap-5"
    >
      {/* Icon */}
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex
        items-center justify-center text-3xl flex-shrink-0 relative">
        {service.icon}
        {service.totalBookings > 300 && (
          <div className="absolute -top-1 -right-1 bg-secondary
            text-white text-xs w-5 h-5 rounded-full flex items-center
            justify-center">
            🔥
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-gray-800 text-lg">
            {service.name}
          </h3>
          <span className="bg-indigo-100 text-primary text-xs
            px-2 py-0.5 rounded-full flex-shrink-0">
            {service.category}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-2 truncate">
          {service.description}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            ⭐ {service.rating}
            <span className="text-gray-400 ml-1">
              ({service.totalBookings} bookings)
            </span>
          </span>
          <span className="text-sm text-gray-400">
            ⏱️ {service.time}
          </span>
        </div>
      </div>

      {/* Price & Button */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right">
          <span className="text-xs text-gray-400 block">
            Starting from
          </span>
          <span className="text-secondary font-bold text-xl">
            ₹{service.price}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBookNow}
          className="bg-primary text-white px-5 py-2.5 rounded-xl
            font-medium hover:bg-indigo-700 transition shadow-md"
        >
          Book Now
        </motion.button>
      </div>
    </motion.div>
  );
}

export default ServiceCard;