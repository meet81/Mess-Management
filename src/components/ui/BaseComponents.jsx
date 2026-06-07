import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 24, className = '', fullscreen = false }) => {
    const spinner = (
        <Loader2
            size={size}
            className={`animate-spin text-orange-500 ${className}`}
        />
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
        {children}
    </div>
);

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "flex justify-center items-center py-2 px-4 rounded-xl text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "text-white bg-orange-500 hover:bg-orange-600 focus:ring-orange-500",
        secondary: "text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500",
        danger: "text-white bg-red-500 hover:bg-red-600 focus:ring-red-500",
        outline: "border-2 border-orange-500 text-orange-600 hover:bg-orange-50 focus:ring-orange-500"
    };

    return (
        <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};
