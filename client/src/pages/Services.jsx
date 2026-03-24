import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const servicesList = [
  {
    icon: "🔧",
    name: "Plumber",
    price: 200,
    category: "Home Repair",
    description: "Pipe leak, bathroom repair, tap fix",
    rating: 4.8,
    totalBookings: 250,
    time: "30-60 min"
  },
  {
    icon: "⚡",
    name: "Electrician",
    price: 250,
    category: "Home Repair",
    description: "Wiring, fan installation, switch repair",
    rating: 4.7,
    totalBookings: 320,
    time: "45-90 min"
  },
  {
    icon: "🪚",
    name: "Carpenter",
    price: 300,
    category: "Home Repair",
    description: "Furniture repair, door fix, woodwork",
    rating: 4.6,
    totalBookings: 180,
    time: "1-2 hours"
  },
  {
    icon: "🎨",
    name: "Painter",
    price: 350,
    category: "Home Repair",
    description: "Wall painting, waterproofing",
    rating: 4.5,
    totalBookings: 150,
    time: "2-4 hours"
  },
  {
    icon: "❄️",
    name: "AC Mechanic",
    price: 400,
    category: "Appliances",
    description: "AC repair, service, installation",
    rating: 4.9,
    totalBookings: 420,
    time: "1-2 hours"
  },
  {
    icon: "🧹",
    name: "Cleaner",
    price: 150,
    category: "Cleaning",
    description: "Home cleaning, deep cleaning",
    rating: 4.7,
    totalBookings: 380,
    time: "2-3 hours"
  },
  {
    icon: "🔒",
    name: "Locksmith",
    price: 200,
    category: "Home Repair",
    description: "Lock repair, key duplicate",
    rating: 4.6,
    totalBookings: 120,
    time: "30-45 min"
  },
  {
    icon: "🌿",
    name: "Gardener",
    price: 180,
    category: "Outdoor",
    description: "Garden maintenance, plant care",
    rating: 4.5,
    totalBookings: 90,
    time: "1-2 hours"
  },
  {
    icon: "🖥️",
    name: "IT Support",
    price: 300,
    category: "Appliances",
    description: "Computer repair, software install",
    rating: 4.8,
    totalBookings: 200,
    time: "1-2 hours"
  },
  {
    icon: "🚿",
    name: "Bathroom Fitter",
    price: 400,
    category: "Home Repair",
    description: "Bathroom renovation, fittings",
    rating: 4.7,
    totalBookings: 110,
    time: "2-4 hours"
  },
  {
    icon: "🧺",
    name: "Laundry",
    price: 100,
    category: "Cleaning",
    description: "Clothes washing, dry cleaning",
    rating: 4.6,
    totalBookings: 290,
    time: "1 day"
  },
  {
    icon: "🐛",
    name: "Pest Control",
    price: 500,
    category: "Cleaning",
    description: "Insects, rodents, termite control",
    rating: 4.8,
    totalBookings: 160,
    time: "2-3 hours"
  },
];

const categories = [
  { name: "All", icon: "🌟" },
  { name: "Home Repair", icon: "🏠" },
  { name: "Cleaning", icon: "🧹" },
  { name: "Appliances", icon: "⚙️" },
  { name: "Outdoor", icon: "🌿" },
];

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating", label: "Best Rating" },
];

function Services() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');

  // Filter Logic
  let filteredServices = servicesList.filter(service => {
    const matchSearch = service.name.toLowerCase()
      .includes(search.toLowerCase()) ||
      service.description.toLowerCase()
      .includes(search.toLowerCase());
    const matchCategory = activeCategory === 'All' ||
      service.category === activeCategory;
    return matchSearch && matchCategory;
  });

  // Sort Logic
  filteredServices = [...filteredServices].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.totalBookings - a.totalBookings;
  });

  const handleBookNow = (service) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Pehle Login Karo! 😊');
      navigate('/login');
      return;
    }
    navigate(`/booking/${service.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== HERO SECTION ===== */}
      <section className="bg-gradient-to-br from-indigo-900 via-primary to-indigo-700 py-20 px-4 relative overflow-hidden">

        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary opacity-10 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-white bg-opacity-20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4 backdrop-blur-sm"
          >
            🔧 {servicesList.length}+ Services Available
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Kaunsi Service <span className="text-secondary">Chahiye?</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-indigo-200 text-lg mb-8"
          >
            Verified experts, best price, at your doorstep!
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl flex items-center p-2 max-w-xl mx-auto shadow-2xl"
          >
            <span className="pl-3 text-gray-400 text-xl">🔍</span>
            <input
              type="text"
              placeholder="Service search karo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 text-gray-700 outline-none rounded-xl text-lg"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 px-3"
              >
                ✕
              </button>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-8 mt-8"
          >
            {[
              { number: "500+", label: "Experts" },
              { number: "1000+", label: "Bookings" },
              { number: "4.8⭐", label: "Rating" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <h3 className="text-2xl font-bold text-white">
                  {stat.number}
                </h3>
                <p className="text-indigo-300 text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FILTER SECTION ===== */}
      <section className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto">
              {categories.map((cat) => (
                <motion.button
                  key={cat.name}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition ${
                    activeCategory === cat.name
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
                  }`}
                >
                  {cat.icon} {cat.name}
                </motion.button>
              ))}
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3">

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none focus:border-primary bg-white"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* View Mode */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-gray-400'
                  }`}
                >
                  ⊞
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-gray-400'
                  }`}
                >
                  ☰
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section className="max-w-6xl mx-auto px-4 py-10">

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500">
            <span className="font-bold text-gray-800">
              {filteredServices.length}
            </span> services mile
          </p>
          {(search || activeCategory !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setActiveCategory('All');
              }}
              className="text-primary text-sm font-medium hover:underline"
            >
              Reset Filters ✕
            </button>
          )}
        </div>

        {/* Services Grid/List */}
        <AnimatePresence mode="wait">
          {filteredServices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-6xl mb-4">😕</p>
              <p className="text-gray-500 text-xl mb-4">
                Koi service nahi mili!
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setActiveCategory('All');
                }}
                className="bg-primary text-white px-6 py-2 rounded-full"
              >
                Reset Karo
              </button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-6 text-center">
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {service.icon}
                    </div>
                    <span className="bg-indigo-100 text-primary text-xs px-3 py-1 rounded-full font-medium">
                      {service.category}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                      {service.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3">
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
                        <span className="text-xs text-gray-400">
                          Starting from
                        </span>
                        <p className="text-secondary font-bold text-xl">
                          ₹{service.price}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBookNow(service)}
                        className="bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
                      >
                        Book Now
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // List View
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 flex items-center gap-5"
                >
                  {/* Icon */}
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                    {service.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 text-lg">
                        {service.name}
                      </h3>
                      <span className="bg-indigo-100 text-primary text-xs px-2 py-0.5 rounded-full">
                        {service.category}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        ⭐ {service.rating} ({service.totalBookings} bookings)
                      </span>
                      <span className="text-sm text-gray-500">
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
                      onClick={() => handleBookNow(service)}
                      className="bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-md"
                    >
                      Book Now
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="bg-gradient-to-r from-primary to-indigo-800 py-16 px-4 mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Worker Banana Chahte Ho? 👷
          </h2>
          <p className="text-indigo-200 mb-8">
            NipunGo par register karo aur
            hazaro customers tak pahuncho!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            className="bg-white text-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl"
          >
            Worker Register Karo ✨
          </motion.button>
        </motion.div>
      </section>

    </div>
  );
}

export default Services;