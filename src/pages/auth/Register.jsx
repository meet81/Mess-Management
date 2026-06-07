import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('Student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { user } = useAuth();

    // If already logged in, redirect to dashboard
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axiosClient.post('/auth/register', {
                fullName: name,
                email: email,
                password: password,
                role: role
            });
            alert(`Registration successful! You can now login.`);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-orange-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

                {/* Left Side - Image/Illustration Shared Area */}
                <div className="lg:w-1/2 bg-orange-100 p-8 lg:p-12 hidden md:flex flex-col justify-center items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-500/20 z-0"></div>
                    {/* Decorative circles */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-orange-300 blur-3xl opacity-30"></div>
                    <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-amber-400 blur-3xl opacity-30"></div>

                    <div className="z-10 text-center mb-8">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">Smart Mess Management</h2>
                        <p className="text-gray-600 text-lg">Delicious meals, managed efficiently for a better hostel experience.</p>
                    </div>

                    <div className="z-10 relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-xl border-4 border-white/50">
                        <img
                            src="/mess-illustration.png"
                            alt="Healthy Meal Illustration"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Right Side - Dynamic Auth Form */}
                <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="mb-8 text-center lg:text-left">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
                        <p className="mt-2 text-gray-500">Sign up to access the mess platform.</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    autoComplete="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 focus:bg-white"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
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
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 focus:bg-white"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Requested Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white"
                            >
                                <option value="Student">Student</option>
                                <option value="Staff">Staff</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 focus:bg-white"
                                    placeholder="Create a password"
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
                            className={`w-full flex justify-center items-center py-3.5 px-4 mt-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all duration-200 group ${loading ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'}`}
                        >
                            {loading ? 'Processing...' : 'Sign Up'}
                            {!loading && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    {/* Login Option */}
                    <div className="mt-8 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
