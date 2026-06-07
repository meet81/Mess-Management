import React, { useState } from 'react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate sending reset email
        setSubmitted(true);
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
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Recover Password</h1>
                        <p className="mt-2 text-gray-500">Enter your email to receive reset instructions.</p>
                    </div>

                    {submitted ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="bg-orange-100 p-3 rounded-full text-orange-500">
                                    <Send size={24} />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Check your email</h3>
                            <p className="text-gray-600 mb-6 mx-auto text-sm">
                                We sent a password reset link to <span className="font-medium text-gray-900">{email}</span>.
                            </p>
                            <Link
                                to="/login"
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
                            >
                                Send Reset Instructions
                            </button>

                            <div className="text-center mt-6">
                                <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">
                                    <ArrowLeft size={16} className="mr-2" />
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
