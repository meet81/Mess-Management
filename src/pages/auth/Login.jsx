import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  GraduationCap,
  User as UserIcon,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";

const Login = () => {
  // We don't need to specify Role for login, the API token returns it!
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.post("/auth/login", {
        email,
        password,
      });

      // Expected response: { id, token, email, role, fullName }
      login(response.data);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-orange-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left Side - Image/Illustration */}
        <div className="lg:w-1/2 bg-orange-100 p-8 lg:p-12 hidden md:flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-500/20 z-0"></div>
          {/* Decorative circles */}
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-orange-300 blur-3xl opacity-30"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-amber-400 blur-3xl opacity-30"></div>

          <div className="z-10 text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Smart Mess Management
            </h2>
            <p className="text-gray-600 text-lg">
              Delicious meals, managed efficiently for a better hostel
              experience.
            </p>
          </div>

          <div className="z-10 relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-xl border-4 border-white/50">
            <img
              src="/mess-illustration.png"
              alt="Healthy Meal Illustration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="mt-2 text-gray-500">
              Please enter your details to sign in.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all duration-200 group ${loading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"}`}
            >
              {loading ? "Connecting..." : "Sign In"}
              {!loading && (
                <ArrowRight
                  size={18}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>
          </form>

          {/* Register Option */}
          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-orange-600 hover:text-orange-500 transition-colors"
            >
              Request access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
