import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
  const res = await fetch("http://127.0.0.1:8000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (res.ok) {
    
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("name", data.name);

    navigate("/dashboard");
  } else {
    alert(data.detail);
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
        AI Game Discovery
      </h1>

      <p className="text-gray-300 mb-8 text-sm">
        Discover your next obsession.
        Powered by intelligent similarity.
      </p>

      <input
        className="w-full p-3 mb-4 bg-black/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full p-3 mb-6 bg-black/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-transform duration-300"
      >
        Login
      </button>

      <p className="mt-6 text-sm text-gray-400">
        No account?{" "}
        <Link to="/register" className="text-purple-400 hover:underline">
          Register
        </Link>
      </p>

         
    </div>
  </div>
  </motion.div>
);
}