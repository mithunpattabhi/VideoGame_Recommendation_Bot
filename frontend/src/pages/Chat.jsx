import { motion } from "framer-motion";
import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [games, setGames] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      if (data.games && data.games.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            type: "games",
            games: data.games,
          },
        ]);
      } else if (data.text) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.text },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Couldn't find matching games." },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "AI assistant unavailable." },
      ]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addToWishlist = async (game) => {
    try {
      const userId = localStorage.getItem("user_id");

      const res = await fetch("http://127.0.0.1:8000/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          app_id: game.appid,
        }),
      });

      const data = await res.json();

      alert(data.message);
    } catch (error) {
      alert("Failed to add to wishlist");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen text-white"
    >
      <div className="min-h-screen bg-slate-800/82 text-white flex flex-col backdrop-blur-xl">
        <Navbar />

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Game Discovery
            </h1>
            <p className="text-gray-500 text-base font-light">Chat with our AI to find your next favorite game</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2">

            {messages.map((msg, index) => {

              if (msg.type === "games") {
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="flex justify-center mb-6">
                      <div className="text-sm text-gray-400 font-medium tracking-wide">
                        ✨ Recommended for you
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {msg.games.map((game, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="group relative bg-gray-900/40 border border-gray-800/60 rounded-2xl overflow-hidden hover:border-gray-700/80 transition-all duration-300"
                        >
                          <div className="relative overflow-hidden h-52">
                            <img
                              src={game.header_image}
                              alt={game.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                          </div>

                          <div className="p-5 space-y-3">
                            <h3 className="text-lg font-semibold text-white leading-tight group-hover:text-amber-300 transition-colors duration-200">
                              {game.name}
                            </h3>

                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                              {game.short_description?.slice(0, 100)}...
                            </p>

                            <div className="flex gap-3 pt-2">
                              <a
                                href={game.steam_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 text-center px-3 py-2 text-sm font-medium text-white bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg transition-all duration-200"
                              >
                                Steam
                              </a>

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => addToWishlist(game)}
                                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-lg transition-all duration-200"
                              >
                                ❤️ Save
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-amber-600/20 border border-amber-500/30 text-white"
                        : "bg-gray-900/40 border border-gray-800/60 text-gray-300"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-900/40 border border-gray-800/60 px-5 py-3 rounded-2xl flex gap-2">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="w-2 h-2 bg-gray-500 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                    className="w-2 h-2 bg-gray-500 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-500 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for game recommendations..."
              className="flex-1 px-5 py-3 bg-gray-900/50 border border-gray-800/60 text-white placeholder-gray-600 rounded-xl focus:outline-none focus:border-gray-700/80 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={sendMessage}
              disabled={loading}
              className="px-6 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}