"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { queryClient } from "@/lib/queryClient";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation for signup
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/login" : "/api/register";
      const data = mode === "login" ? { email, password } : { email, password, firstName, lastName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (res.ok) {
        const {token}= await res.json()
        localStorage.setItem("token",token);
        window.location.href = "/";
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        const data = await res.json();
        setError(data.message || `Failed to ${mode}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setEmail("");
    setPassword("");
    setLastName("")
    setFirstName("")
    setConfirmPassword("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700"
      >
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-center text-gray-300 mb-6">
          {mode === "login"
            ? "Sign in with your account to continue"
            : "Create a new account to get started"}
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-100/20 p-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {
            mode === "signup" && <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                First Name
              </label>
              <input
                id="firstName"
                type="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-600 bg-gray-800 text-white placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 border"
                placeholder="first name"
              />
            </div>
          }

          {
            mode === "signup" && <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                Last Name
              </label>
              <input
                id="lastName"
                type="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-600 bg-gray-800 text-white placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 border"
                placeholder="last name"
              />
            </div>
          }

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border-gray-600 bg-gray-800 text-white placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 border"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border-gray-600 bg-gray-800 text-white placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 border"
              placeholder="••••••••"
              minLength={mode === "signup" ? 6 : undefined}
            />
          </div>

          {mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-600 bg-gray-800 text-white placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 border"
                placeholder="••••••••"
                minLength={6}
              />
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50"
          >
            {loading
              ? (mode === "login" ? "Signing in..." : "Creating account...")
              : (mode === "login" ? "Login" : "Sign Up")
            }
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {mode === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}