import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
export default function Register() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleRegister = async () => {
    const res = await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      navigate("/login");
    } else {
      alert("Registration failed");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRegister();
    }
  };

  return (
     <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.35 }}
      >
  <div className="min-h-screen flex items-center justify-center px-6">

    <div className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 p-10 rounded-3xl shadow-2xl">

      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
        Create Your Account
      </h1>

      <p className="text-gray-300 mb-8 text-sm">
        Join the future of game discovery.
      </p>

      <input
        className="w-full p-3 mb-4 bg-black/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        placeholder="Name"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        onKeyPress={handleKeyPress}
      />

      <input
        className="w-full p-3 mb-4 bg-black/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        onKeyPress={handleKeyPress}
      />

      <input
        className="w-full p-3 mb-6 bg-black/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        onKeyPress={handleKeyPress}
      />

      <button
        onClick={handleRegister}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-transform duration-300"
      >
        Register
      </button>

      <p className="mt-6 text-sm text-gray-400">
        Already have account?{" "}
        <Link to="/login" className="text-purple-400 hover:underline">
          Login
        </Link>
      </p>
         
    </div>
  </div>
  </motion.div>
);
}