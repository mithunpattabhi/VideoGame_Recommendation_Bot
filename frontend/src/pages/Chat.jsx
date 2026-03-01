
import { motion } from "framer-motion";
import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages([...messages, userMessage]);

    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    const botMessage = { sender: "bot", text: data.response };

    setMessages((prev) => [...prev, botMessage]);
    setInput("");
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

      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col h-[80vh]">

        <div className="flex-1 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
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
          ))}
        </div>

        <div className="flex mt-6">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chat..."
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
   
    