import React from 'react';

function Home() {
  return (
    <div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-indigo-800 min-h-screen flex items-center justify-center text-white">
        <div className="text-center px-4">
          <h1 className="text-5xl font-bold mb-6">
            Expert Services at <br />
            <span className="text-secondary">Your Doorstep</span>
          </h1>
          <p className="text-xl mb-8 text-indigo-200">
            Plumber, Electrician, Carpenter aur bahut kuch - 
            Sirf ek click mein!
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-full flex items-center p-2 max-w-lg mx-auto shadow-lg">
            <input
              type="text"
              placeholder="Kaunsi service chahiye?"
              className="flex-1 px-4 py-2 text-gray-700 outline-none rounded-full"
            />
            <button className="bg-secondary text-white px-6 py-2 rounded-full hover:bg-orange-600">
              Search
            </button>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-10 mt-12">
            <div>
              <h3 className="text-3xl font-bold">500+</h3>
              <p className="text-indigo-200">Workers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold">1000+</h3>
              <p className="text-indigo-200">Customers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold">50+</h3>
              <p className="text-indigo-200">Cities</p>
            </div>
          </div>

        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 px-4 bg-gray-50">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
          Hamari <span className="text-primary">Services</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          
          {/* Service Card */}
          {[
            { icon: "🔧", name: "Plumber", price: "₹200" },
            { icon: "⚡", name: "Electrician", price: "₹250" },
            { icon: "🪚", name: "Carpenter", price: "₹300" },
            { icon: "🎨", name: "Painter", price: "₹350" },
            { icon: "❄️", name: "AC Mechanic", price: "₹400" },
            { icon: "🧹", name: "Cleaner", price: "₹150" },
            { icon: "🔒", name: "Locksmith", price: "₹200" },
            { icon: "🌿", name: "Gardener", price: "₹180" },
          ].map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-xl transition cursor-pointer hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">{service.icon}</div>
              <h3 className="font-bold text-gray-800">{service.name}</h3>
              <p className="text-secondary font-medium mt-1">
                From {service.price}
              </p>
              <button className="mt-3 bg-primary text-white px-4 py-1 rounded-full text-sm hover:bg-indigo-700">
                Book Now
              </button>
            </div>
          ))}

        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 px-4 bg-white">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
          Kaise <span className="text-primary">Kaam Karta Hai?</span>
        </h2>

        <div className="flex flex-col md:flex-row justify-center gap-8 max-w-4xl mx-auto">
          {[
            { step: "1", icon: "🔍", title: "Service Dhundo", desc: "Apni zaroorat ki service select karo" },
            { step: "2", icon: "👨‍🔧", title: "Worker Choose Karo", desc: "Rating aur price dekh kar best worker chuno" },
            { step: "3", icon: "📅", title: "Book Karo", desc: "Date aur time select karke booking confirm karo" },
            { step: "4", icon: "✅", title: "Kaam Ho Gaya!", desc: "Expert worker ghar aayega aur kaam karega" },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Home;