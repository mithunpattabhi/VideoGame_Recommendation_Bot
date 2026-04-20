import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Register() {
  const [form, setForm] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        navigate("/login");
      } else {
        alert("Registration failed");
      }
    } catch (err) {
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRegister();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-800/88 backdrop-blur-xl flex items-center justify-center px-6"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-950/90 border border-slate-700/80 backdrop-blur-xl p-10 rounded-2xl">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl mb-8 text-center font-bold tracking-tight text-white"
          >
            GameRecommender
          </motion.div>

          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white text-center">
            Create Account
          </h1>

          <p className="text-slate-300 mb-8 text-center text-sm font-light">
            Start discovering your perfect games today
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-slate-200 text-xs font-semibold mb-2 block uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700/70 focus:border-slate-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all text-white placeholder-slate-400 text-sm"
              />
            </div>

            <div>
              <label className="text-slate-200 text-xs font-semibold mb-2 block uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700/70 focus:border-slate-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all text-white placeholder-slate-400 text-sm"
              />
            </div>

            <div>
              <label className="text-slate-200 text-xs font-semibold mb-2 block uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password || ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyPress={handleKeyPress}
                  className="w-full pr-12 px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700/70 focus:border-slate-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all text-white placeholder-slate-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="M12 4.5c-4.74 0-8.73 3.11-10.16 7.5 1.43 4.39 5.42 7.5 10.16 7.5 4.74 0 8.73-3.11 10.16-7.5C20.73 7.61 16.74 4.5 12 4.5zm0 13a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zm0-1.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="M2.37 1.86 1.19 3.03l3.06 3.06C3.39 7.51 1.88 9.39 1 11.5 2.43 15.89 6.42 19 11.16 19c1.09 0 2.14-.16 3.12-.45l3.7 3.7 1.18-1.18L2.37 1.86zm4.5 8.64c.95-1.3 2.43-2.5 4.63-3.13l1.47 1.47c-1.35.27-2.5.9-3.35 1.66-.82.74-1.31 1.65-1.36 2.22zm11.3 4.5-1.5-1.5c-.7.32-1.45.55-2.25.66-.4.05-.81.08-1.23.08-3.3 0-5.96-2.53-6.86-4.93L6.05 8.02c1.38-1.12 3.18-1.81 5.35-1.81 4.74 0 8.73 3.11 10.16 7.5-.36 1.1-.9 2.14-1.57 3.05z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition-all text-sm"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </motion.button>

          <div className="mt-6 text-center">
            <p className="text-slate-300 text-sm">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="text-amber-600 hover:text-amber-500 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-slate-300 text-xs mt-8"
        >
          By creating an account, you agree to our terms
        </motion.p>
      </motion.div>
    </motion.div>
  );
}