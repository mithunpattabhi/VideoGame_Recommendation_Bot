import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
  const name = localStorage.getItem("name");

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const navLinks = [
    { path: "/dashboard", label: "Home" },
    { path: "/wishlist", label: "Wishlist" },
    { path: "/chat", label: "AI Chat" },
  ];

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-gray-800/50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3"
        >
          <div className="text-2xl font-bold tracking-tight text-white">
            GameRecommender
          </div>
        </motion.div>

        <div className="flex gap-10 items-center">
          {navLinks.map((link) => (
            <motion.div key={link.path} whileHover={{ scale: 1.05 }}>
              <Link
                to={link.path}
                className="text-gray-400 hover:text-white font-medium transition-colors duration-200 text-sm tracking-wide"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}

          <div className="h-6 w-px bg-gray-800/50" />

          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm">
              <span className="text-white font-medium">{name}</span>
            </span>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}