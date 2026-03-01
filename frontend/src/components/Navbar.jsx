import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const name = localStorage.getItem("name");

const logout = () => {
  localStorage.clear();
  window.location.href = "/login";
};

  return (
    <div className="relative flex justify-between items-center p-6 backdrop-blur-md bg-black/30 border-b border-white/10">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-[length:200%_200%] animate-gradient text-transparent bg-clip-text">
        AI Game Discovery
      </h1>

      <div className="flex gap-6 items-center">
        <Link to="/dashboard">Home</Link>
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/chat">AI Chat</Link>
        <span className="text-gray-400">Hi, {name}</span>
        <button
          onClick={logout}
          className="bg-red-500 px-4 py-1 rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}