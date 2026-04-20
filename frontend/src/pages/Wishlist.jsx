import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";

export default function Wishlist() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      const res = await fetch(
        `http://127.0.0.1:8000/wishlist?user_id=${userId}`
      );
      const data = await res.json();
      setGames(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (appId) => {
    const userId = localStorage.getItem("user_id");
    await fetch("http://127.0.0.1:8000/wishlist/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: Number(userId),
        app_id: appId,
      }),
    });
    setGames((prev) => prev.filter((g) => g.AppID !== appId));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-800/85 backdrop-blur-xl"
    >
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold tracking-tight mb-3 text-white">
            Your Wishlist
          </h1>
          <p className="text-gray-500 text-lg font-light">
            {games.length === 0 ? "Start adding games to your wishlist" : `You have ${games.length} game${games.length !== 1 ? "s" : ""} in your wishlist`}
          </p>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-20"
          >
            <div className="flex gap-2">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-2 h-2 bg-gray-600 rounded-full"
              />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                className="w-2 h-2 bg-gray-600 rounded-full"
              />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-gray-600 rounded-full"
              />
            </div>
          </motion.div>
        ) : games.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="text-6xl mb-6">📭</div>
            <p className="text-2xl font-bold text-gray-400 mb-4">No games yet</p>
            <p className="text-gray-600 mb-8">Head to the Dashboard to add games to your wishlist</p>
            <motion.a
              whileHover={{ scale: 1.02 }}
              href="/dashboard"
              className="px-8 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-white font-medium rounded-lg transition-all"
            >
              Go to Dashboard
            </motion.a>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
            {games.map((game, idx) => (
              <motion.div
                key={game.AppID}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group relative bg-gray-900/40 border border-gray-800/60 rounded-xl overflow-hidden hover:border-gray-700/80 transition-all duration-300"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.AppID}/header.jpg`}
                    alt={game.Name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 line-clamp-2 transition-colors">
                    {game.Name}
                  </h3>

                  <div className="text-xs text-gray-500">
                    {game.playtime_hours?.toFixed(1)} hrs
                  </div>

                  <div className="flex gap-2 pt-2">
                    <a
                      href={game.steam_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center px-3 py-2 text-xs font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg transition-all"
                    >
                      Steam
                    </a>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => removeFromWishlist(game.AppID)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-white bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all"
                    >
                      Remove
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}