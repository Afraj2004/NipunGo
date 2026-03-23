import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const servicesList = [
  { 
    icon: "🔧", 
    name: "Plumber", 
    price: 200,
    description: "Pipe leak, bathroom repair, tap fix",
    rating: 4.8
  },
  { 
    icon: "⚡", 
    name: "Electrician", 
    price: 250,
    description: "Wiring, fan installation, switch repair",
    rating: 4.7
  },
  { 
    icon: "🪚", 
    name: "Carpenter", 
    price: 300,
    description: "Furniture repair, door fix, woodwork",
    rating: 4.6
  },
  { 
    icon: "🎨", 
    name: "Painter", 
    price: 350,
    description: "Wall painting, waterproofing",
    rating: 4.5
  },
  { 
    icon: "❄️", 
    name: "AC Mechanic", 
    price: 400,
    description: "AC repair, service, installation",
    rating: 4.9
  },
  { 
    icon: "🧹", 
    name: "Cleaner", 
    price: 150,
    description: "Home cleaning, deep cleaning",
    rating: 4.7
  },
  { 
    icon: "🔒", 
    name: "Locksmith", 
    price: 200,
    description: "Lock repair, key duplicate",
    rating: 4.6
  },
  { 
    icon: "🌿", 
    name: "Gardener", 
    price: 180,
    description: "Garden maintenance, plant care",
    rating: 4.5
  },
];

function Services() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Search filter
  const filteredServices = servicesList.filter(service =>
    service.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBookNow = (service) => {
    // Check karo user login hai ya nahi
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Pehle Login Karo! 😊');
      navigate('/login');
      return;
    }
    // Booking page par bhejo
    navigate(`/booking/${service.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-indigo-800 py-16 px-4 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">
          Hamari <span className="text-secondary">Services</span>
        </h1>
        <p className="text-indigo-200 mb-8">
          Expert workers - Just one click away!
        </p>

        {/* Search Bar */}
        <div className="bg-white rounded-full flex items-center p-2 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Service search karo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 text-gray-700 outline-none rounded-full"
          />
          <button className="bg-secondary text-white px-6 py-2 rounded-full">
            🔍
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredServices.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition hover:-translate-y-1 cursor-pointer"
            >
              {/* Icon */}
              <div className="text-5xl mb-4 text-center">
                {service.icon}
              </div>

              {/* Name */}
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                {service.name}
              </h3>

              {/* Description */}
              <p className="text-gray-500 text-sm text-center mb-3">
                {service.description}
              </p>

              {/* Rating */}
              <div className="flex justify-center items-center gap-1 mb-3">
                <span className="text-yellow-400">⭐</span>
                <span className="text-gray-600 font-medium">
                  {service.rating}
                </span>
              </div>

              {/* Price */}
              <p className="text-secondary font-bold text-center text-lg mb-4">
                From ₹{service.price}
              </p>

              {/* Book Button */}
              <button
                onClick={() => handleBookNow(service)}
                className="w-full bg-primary text-white py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredServices.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">😕</p>
            <p className="text-gray-500 text-xl">
              Koi service nahi mili!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Services;