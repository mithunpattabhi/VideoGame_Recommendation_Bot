import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";

export default function Dashboard() {
  const userId = localStorage.getItem("user_id");
  const [games, setGames] = useState([]);
  const [likedGames, setLikedGames] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [maxHours, setMaxHours] = useState(12);
  const [mode, setMode] = useState("similar");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value) => {
    setSearchInput(value);
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(
      `http://127.0.0.1:8000/search-game?query=${value}`
    );
    const data = await res.json();
    setSuggestions(data.results);
  };

  const selectGame = (game) => {
    if (!likedGames.some((g) => g.AppID === game.AppID)) {
      setLikedGames([...likedGames, game]);
    }
    setSearchInput("");
    setSuggestions([]);
  };

  const removeGame = (id) => {
    setLikedGames(likedGames.filter((g) => g.AppID !== id));
  };

  const fetchRecommendations = async (pageNumber = 1) => {
    if (likedGames.length === 0) {
      alert("Please select at least one game first");
      return;
    }
    setLoading(true);
    try {
      const userId = localStorage.getItem("user_id");
      const res = await fetch(
        `http://127.0.0.1:8000/recommend?page=${pageNumber}&limit=12`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            user_id: Number(userId),
            max_hours: maxHours,
            exploration_mode: mode,
            liked_app_ids: likedGames.map((g) => g.AppID),
          }),
        }
      );
      const data = await res.json();
      if (pageNumber === 1) {
        setGames(data.results);
      } else {
        setGames((prev) => [...prev, ...data.results]);
      }
      setHasMore(data.has_more);
      setPage(pageNumber);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!hasMore) return;
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 200 &&
        !loading
      ) {
        fetchRecommendations(page + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, loading]);

  const addToWishlist = async (appId) => {
    const userId = localStorage.getItem("user_id");
    await fetch("http://127.0.0.1:8000/wishlist/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        app_id: appId,
      }),
    });
    alert("Added to wishlist!");
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
            Discover Your Next Game
          </h1>
          <p className="text-slate-300 text-lg font-light">
            Select games you love, and we'll recommend similar ones
          </p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/75 border border-slate-700/80 backdrop-blur-xl rounded-3xl p-8 mb-12 shadow-2xl shadow-slate-950/10"
        >
          <div className="space-y-8">
            <div className="relative">
              <input
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for your favorite game..."
                className="w-full px-5 py-4 rounded-xl bg-slate-900/70 border border-slate-700/70 focus:border-slate-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all text-white placeholder-slate-400 text-base"
              />

              {suggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-800/60 rounded-xl shadow-2xl z-10 max-h-64 overflow-y-auto"
                >
                  {suggestions.map((game, idx) => (
                    <motion.div
                      key={game.AppID}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => selectGame(game)}
                      className="px-5 py-3 hover:bg-slate-800/70 cursor-pointer border-b border-slate-700/60 transition-colors text-slate-200 text-sm"
                    >
                      {game.Name}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {likedGames.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
              >
                {likedGames.map((game, idx) => (
                  <motion.div
                    key={game.AppID}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.08 }}
                    className="bg-slate-800/60 border border-slate-700/70 px-4 py-2 rounded-full flex items-center gap-2 text-sm text-slate-200 group hover:border-slate-600/80 transition-all"
                  >
                    <span>{game.Name}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => removeGame(game.AppID)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      ✕
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 font-medium mb-4 text-sm tracking-wide">
                  Max Playtime: <span className="text-white">{maxHours} hrs</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={maxHours}
                  onChange={(e) => setMaxHours(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-4 text-sm tracking-wide">
                  Recommendation Mode
                </label>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMode("similar")}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                      mode === "similar"
                        ? "bg-amber-600/20 border border-amber-500/40 text-white"
                        : "bg-slate-800/60 border border-slate-700/70 text-slate-300 hover:text-white"
                    }`}
                  >
                    Similar
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMode("explore")}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                      mode === "explore"
                        ? "bg-amber-600/20 border border-amber-500/40 text-white"
                        : "bg-slate-800/60 border border-slate-700/70 text-slate-300 hover:text-white"
                    }`}
                  >
                    Explore
                  </motion.button>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchRecommendations(1)}
              disabled={likedGames.length === 0}
              className="w-full bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-semibold text-white transition-all"
            >
              Get Recommendations
            </motion.button>
          </div>
        </motion.div>

        {games.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Recommendations for You
            </h2>

            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
              {games.map((game, idx) => (
                <motion.div
                  key={game.AppID}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group relative bg-slate-900/75 border border-slate-700/80 rounded-xl overflow-hidden hover:border-slate-600/80 transition-all duration-300 shadow-xl shadow-slate-950/10"
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

                    <div className="text-xs text-slate-400">
                      {game.playtime_hours?.toFixed(1)} hrs
                    </div>

                    <div className="flex gap-2 pt-2">
                      <a
                        href={game.steam_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/70 rounded-lg transition-all"
                      >
                        Steam
                      </a>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={() => addToWishlist(game.AppID)}
                        className="flex-1 px-3 py-2 text-xs font-medium text-white bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-lg transition-all"
                      >
                        Save
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-12"
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
        )}
      </div>
    </motion.div>
  );
}