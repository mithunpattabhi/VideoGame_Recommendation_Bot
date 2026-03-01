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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.35 }}
      >
    <div className="min-h-screen bg-darkbg text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-10 text-primary">
          🎯 Your Wishlist
        </h2>

        {loading ? (
          <div className="text-center text-gray-400">
            Loading wishlist...
          </div>
        ) : games.length === 0 ? (
          <div className="text-center text-gray-500">
            Your wishlist is empty.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
  {games.map((game) => (
    <div
      key={game.AppID}
      className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl hover:-translate-y-2 hover:shadow-2xl transition-all"
    >
      <img
        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.AppID}/header.jpg`}
        className="rounded-lg mb-4"
      />

      <h3 className="text-xl text-cyan-300">
        {game.Name}
      </h3>

      <div className="mt-2 bg-purple-700 px-3 py-1 rounded-full inline-block text-sm">
        ⏱ {game.playtime_hours?.toFixed(1)} hrs
      </div>

      <div className="flex justify-between mt-4">
        <a
          href={game.steam_url}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Steam →
        </a>

        <button
          onClick={() => removeFromWishlist(game.AppID)}
          className="bg-red-500 px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition"
        >
          Remove
        </button>

        
      </div>
    </div>
  ))}
</div>
        )}
      </div>
    </div>
    </motion.div>
  );
}