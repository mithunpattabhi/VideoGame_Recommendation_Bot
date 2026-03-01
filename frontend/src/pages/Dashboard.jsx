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
    },
    body: JSON.stringify({
      user_id: Number(userId),
      app_id: appId,
    }),
  });

  alert("Added to wishlist!");
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

      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Welcome Back.
        </h1>
        <p className="text-gray-400 mt-4">
          Ready to discover your next adventure?
        </p>
      </div>
        
        <div className="flex flex-col items-center mb-10">

          <input
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search a game..."
            className="w-96 px-4 py-3 rounded-xl bg-white/10 border border-white/20"
          />

          {suggestions && suggestions.length > 0 && (
            <div className="bg-slate-800 w-96 rounded-xl mt-2">
              {suggestions.map((game) => (
                <div
                  key={game.AppID}
                  onClick={() => selectGame(game)}
                  className="px-4 py-2 hover:bg-primary cursor-pointer"
                >
                  {game.Name}
                </div>
              ))}
            </div>
          )}

          
          <div className="flex flex-wrap gap-3 mt-4">
            {likedGames.map((game) => (
              <div
                key={game.AppID}
                className="bg-primary px-4 py-2 rounded-xl"
              >
                {game.Name}
                <button
                  onClick={() => removeGame(game.AppID)}
                  className="ml-2"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

          
          <div className="mt-6">
            <label>
              Max Playtime: {maxHours} hrs
            </label>
            <input
              type="range"
              min="1"
              max="40"
              value={maxHours}
              onChange={(e) => setMaxHours(Number(e.target.value))}
              className="w-80 ml-4"
            />
          </div>

          
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setMode("similar")}
              className={`px-6 py-2 rounded-xl ${
                mode === "similar"
                  ? "bg-primary"
                  : "bg-white/10"
              }`}
            >
              Similar
            </button>

            <button
              onClick={() => setMode("explore")}
              className={`px-6 py-2 rounded-xl ${
                mode === "explore"
                  ? "bg-accent"
                  : "bg-white/10"
              }`}
            >
              Explore
            </button>
          </div>

          
          <button
            onClick={() => fetchRecommendations(1)}
            className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3 rounded-2xl hover:scale-105 transition"
          >
            Get Recommendations
          </button>
        </div>

       
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
                  onClick={() => addToWishlist(game.AppID)}
                  className="bg-primary px-3 py-1 rounded-lg text-sm"
                >
                  + Wishlist
                </button>

                   
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center mt-10 text-gray-400">
            Loading more games...
          </div>
        )}
      </div>
    </div>
    </motion.div>
  );
}