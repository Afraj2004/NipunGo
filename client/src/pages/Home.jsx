import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Animation Variants
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

// Services Data
const servicesList = [
  { icon: "🔧", name: "Plumber", price: 200 },
  { icon: "⚡", name: "Electrician", price: 250 },
  { icon: "🪚", name: "Carpenter", price: 300 },
  { icon: "🎨", name: "Painter", price: 350 },
  { icon: "❄️", name: "AC Mechanic", price: 400 },
  { icon: "🧹", name: "Cleaner", price: 150 },
  { icon: "🔒", name: "Locksmith", price: 200 },
  { icon: "🌿", name: "Gardener", price: 180 },
];

// Stats Data
const stats = [
  { number: "500+", label: "Expert Workers" },
  { number: "1000+", label: "Happy Customers" },
  { number: "50+", label: "Cities" },
  { number: "4.8⭐", label: "Average Rating" },
];

// Steps Data
const steps = [
  {
    step: "1",
    icon: "🔍",
    title: "Service Dhundo",
    desc: "Apni zaroorat ki service select karo"
  },
  {
    step: "2",
    icon: "👨‍🔧",
    title: "Worker Choose Karo",
    desc: "Rating aur price dekh kar best worker chuno"
  },
  {
    step: "3",
    icon: "📅",
    title: "Book Karo",
    desc: "Date aur time select karke booking confirm karo"
  },
  {
    step: "4",
    icon: "✅",
    title: "Kaam Ho Gaya!",
    desc: "Expert worker ghar aayega aur kaam karega"
  },
];

// Testimonials Data
const testimonials = [
  {
    name: "Rahul Sharma",
    city: "Delhi",
    comment: "Bahut achha service mila! Plumber ne ek ghante mein kaam kar diya.",
    rating: 5,
    avatar: "👨"
  },
  {
    name: "Priya Singh",
    city: "Mumbai",
    comment: "NipunGo se electrician book kiya, bahut professional tha!",
    rating: 5,
    avatar: "👩"
  },
  {
    name: "Amit Kumar",
    city: "Bangalore",
    comment: "AC mechanic ne bahut achha kaam kiya. Highly recommended!",
    rating: 4,
    avatar: "🧑"
  },
];

function Home() {
  const navigate = useNavigate();

  const handleBookNow = (serviceName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    navigate(`/booking/${serviceName}`);
  };

  return (
    <div className="overflow-hidden">

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-primary to-indigo-700 flex items-center justify-center overflow-hidden">

        {/* Background Circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-indigo-400 opacity-10 rounded-full blur-2xl"></div>

        <div className="text-center px-4 z-10 max-w-4xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block bg-white bg-opacity-20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-white border-opacity-30"
          >
            🚀 India Ka #1 Home Services App
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Expert Services
            <br />
            <span className="text-secondary">
              Aapke Ghar Par
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto"
          >
            Plumber, Electrician, Carpenter aur bahut kuch -
            Verified experts, sirf ek click mein!
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white rounded-2xl flex items-center p-2 max-w-xl mx-auto shadow-2xl mb-10"
          >
            <input
              type="text"
              placeholder="Kaunsi service chahiye?"
              className="flex-1 px-4 py-3 text-gray-700 outline-none rounded-xl text-lg"
            />
            <button
              onClick={() => navigate('/services')}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
            >
              Search 🔍
            </button>
          </motion.div>

          {/* Quick Service Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {servicesList.slice(0, 4).map((service, index) => (
              <button
                key={index}
                onClick={() => handleBookNow(service.name)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-30 transition backdrop-blur-sm border border-white border-opacity-20"
              >
                {service.icon} {service.name}
              </button>
            ))}
          </motion.div>

        </div>

        {/* Scroll Down Arrow */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white opacity-60"
        >
          <div className="text-2xl">↓</div>
        </motion.div>

      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-16 bg-white">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              className="text-center"
            >
              <h3 className="text-4xl font-bold text-primary mb-2">
                {stat.number}
              </h3>
              <p className="text-gray-500 font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">

          {/* Header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="bg-indigo-100 text-primary px-4 py-1 rounded-full text-sm font-medium">
              Our Services
            </span>
            <h2 className="text-4xl font-bold text-gray-800 mt-4 mb-4">
              Kya Service Chahiye <span className="text-primary">Aapko?</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Hamare verified experts se book karo
              aur quality service pao ghar baithe!
            </p>
          </motion.div>

          {/* Services Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {servicesList.map((service, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                whileHover={{
                  y: -8,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.12)"
                }}
                className="bg-white rounded-2xl p-6 text-center shadow-md cursor-pointer group"
                onClick={() => handleBookNow(service.name)}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">
                  {service.name}
                </h3>
                <p className="text-secondary font-bold mb-4">
                  From ₹{service.price}
                </p>
                <button className="w-full bg-indigo-50 text-primary py-2 rounded-xl font-medium group-hover:bg-primary group-hover:text-white transition duration-300">
                  Book Now
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* View All Button */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <button
              onClick={() => navigate('/services')}
              className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
            >
              Sabhi Services Dekho →
            </button>
          </motion.div>

        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">

          {/* Header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="bg-orange-100 text-secondary px-4 py-1 rounded-full text-sm font-medium">
              How It Works
            </span>
            <h2 className="text-4xl font-bold text-gray-800 mt-4 mb-4">
              Sirf <span className="text-primary">4 Steps</span> Mein!
            </h2>
          </motion.div>

          {/* Steps */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
          >
            {steps.map((item, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                className="text-center relative"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-indigo-100 z-0"></div>
                )}

                {/* Step Number */}
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 relative z-10 shadow-lg">
                  {item.step}
                </div>

                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">

          {/* Header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="bg-green-100 text-green-600 px-4 py-1 rounded-full text-sm font-medium">
              Testimonials
            </span>
            <h2 className="text-4xl font-bold text-gray-800 mt-4 mb-4">
              Customers Kya <span className="text-primary">Kehte Hain?</span>
            </h2>
          </motion.div>

          {/* Testimonial Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((item, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 shadow-md"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-600 mb-6 italic">
                  "{item.comment}"
                </p>

                {/* User */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                    {item.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {item.name}
                    </h4>
                    <p className="text-gray-500 text-sm">
                      📍 {item.city}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-gradient-to-r from-primary to-indigo-800">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto px-4 text-center"
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Book? 🚀
          </h2>
          <p className="text-indigo-200 text-xl mb-8">
            Abhi book karo aur pehli booking par
            special discount pao!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/services')}
              className="bg-secondary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition shadow-xl"
            >
              Abhi Book Karo 🔧
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="bg-white text-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl"
            >
              Free Register Karo ✨
            </motion.button>
          </div>
        </motion.div>
      </section>

    </div>
  );
}

export default Home;