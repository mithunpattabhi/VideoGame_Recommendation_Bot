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
      }
       else {
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
        <Navbar />

        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col h-[80vh]">

          
          <div className="flex-1 overflow-y-auto space-y-4">

            {messages.map((msg, index) => {

  if (msg.type === "games") {
    return (
      <div key={index}>
        <div className="bg-gray-800 p-4 rounded-xl max-w-lg mb-4">
          Here are some recommendations for you:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {msg.games.map((game, i) => (
            <div
              key={i}
              className="bg-gray-900 rounded-xl overflow-hidden shadow-lg"
            >
              <img
                src={game.header_image}
                alt={game.name}
                className="w-full h-60 object-cover"
              />

              <div className="p-4">
                <h3 className="text-xl font-semibold">
                  {game.name}
                </h3>

                <p className="text-sm text-gray-400 mt-2">
                  {game.short_description?.slice(0, 180)}...
                </p>

                <div className="flex justify-between items-center mt-4">
                  <a
                    href={`https://store.steampowered.com/app/${game.appid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline"
                  >
                    View on Steam
                  </a>

                  <button
                    onClick={() => addToWishlist(game)}
                    className="bg-purple-600 px-4 py-2 rounded-lg"
                  >
                    Add to Wishlist
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      key={index}
      className={`p-4 rounded-xl max-w-lg ${
        msg.sender === "user"
          ? "bg-purple-600 ml-auto"
          : "bg-gray-800"
      }`}
    >
      {msg.text}
    </div>
  );
})}

            {loading && (
              <div className="bg-gray-800 p-4 rounded-xl max-w-lg">
                AI thinking...
              </div>
            )}

            
            {games.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {games.map((game, index) => (
                  <div
                    key={index}
                    className="bg-gray-900 rounded-xl overflow-hidden shadow-lg"
                  >
                    <img
                      src={game.header_image}
                      alt={game.name}
                      className="w-full h-48 object-cover"
                    />

                    <div className="p-4">
                      <h3 className="text-xl font-semibold">
                        {game.name}
                      </h3>

                      <p className="text-sm text-gray-400 mt-2">
                        {game.short_description?.slice(0, 150)}...
                      </p>

                      <div className="flex justify-between items-center mt-4">
                        <a
                          href={`https://store.steampowered.com/app/${game.appid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-400 hover:underline"
                        >
                          View on Steam
                        </a>

                        <button
                          onClick={() => addToWishlist(game)}
                          className="bg-purple-600 px-4 py-2 rounded-lg"
                        >
                          Add to Wishlist
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          
          <div className="flex mt-6">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for game recommendations..."
              className="flex-1 p-3 rounded-l-xl bg-gray-800 outline-none"
            />
            <button
              onClick={sendMessage}
              className="px-6 bg-purple-600 rounded-r-xl"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}