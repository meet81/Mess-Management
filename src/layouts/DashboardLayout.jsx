import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Utensils,
    CalendarCheck,
    CreditCard,
    MessageSquare,
    LogOut,
    Menu as MenuIcon,
    X,
    Bell,
    User as UserIcon,
    ShieldAlert,
    CalendarDays,
    Users,
    Package,
    ClipboardList,
    PieChart,
    ShoppingCart,
    Truck,
    Settings,
    QrCode,
    Banknote,
    Clock,
    Coins
} from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { hasPermission } from '../utils/permissions';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, end: true, module: 'Dashboard' },
        { name: 'Menu', path: '/dashboard/menu', icon: <Utensils size={20} />, module: 'Menu' },
        { name: 'Attendance', path: '/dashboard/attendance', icon: <CalendarDays size={20} />, module: 'Attendance' },
        { name: 'Leave', path: '/dashboard/leave', icon: <CalendarDays size={20} />, module: 'Leave' },
        { name: 'Payments', path: '/dashboard/payments', icon: <CreditCard size={20} />, module: 'Payments' },
        { name: 'Users', path: '/dashboard/users', icon: <Users size={20} />, module: 'Users' },
        { name: 'Role Permissions', path: '/dashboard/roles', icon: <ShieldAlert size={20} />, module: 'Roles' },
        
        // Staff Salary Module
        { name: 'Staff Salary', path: '/dashboard/payroll', icon: <Banknote size={20} />, module: 'Payroll' },

        // System Settings
        { name: 'System Settings', path: '/dashboard/settings', icon: <Settings size={20} />, module: 'SystemSettings' },

        // QR Attendance Module
        { name: 'QR Attendance', path: '/dashboard/qr-dashboard', icon: <QrCode size={20} />, module: 'QrAttendance' },
        { name: 'QR Scanner', path: '/dashboard/qr-scanner', icon: <QrCode size={20} />, module: 'QrAttendance', action: 'Create' },
        { name: 'My Digital ID', path: '/dashboard/digital-id', icon: <QrCode size={20} />, module: 'DigitalId' },

        { name: 'Inventory', path: '/dashboard/inventory', icon: <Package size={20} />, end: true, module: 'Inventory' },
        { name: 'Daily Usage', path: '/dashboard/inventory/usage', icon: <PieChart size={20} />, module: 'DailyUsage' },
        { name: 'Vendors', path: '/dashboard/inventory/vendors', icon: <Truck size={20} />, module: 'Vendors' },
        { name: 'Order Suggestions', path: '/dashboard/inventory/suggestions', icon: <ShoppingCart size={20} />, module: 'OrderSuggestions' },
        { name: 'Vendor Orders', path: '/dashboard/inventory/vendor-orders', icon: <ShoppingCart size={20} />, module: 'VendorOrders' },
        { name: 'Feedback', path: '/dashboard/feedback', icon: <MessageSquare size={20} />, module: 'Feedback' },
    ];

    const filteredLinks = navLinks.filter(link => hasPermission(user, link.module, link.action || 'View'));

    useEffect(() => {
        const currentPath = location.pathname;
        const currentLink = navLinks.find(l => currentPath === l.path || (currentPath.startsWith(l.path) && l.path !== '/dashboard'));
        if (currentLink && !hasPermission(user, currentLink.module, currentLink.action || 'View')) {
            navigate('/dashboard', { replace: true });
        }
    }, [location.pathname, user, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-sm relative z-20">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-500/20">
                        M
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                        MessManager
                    </span>
                </div>
            </div>

            {/* Nav Links */}
            <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                    Main Menu
                </div>
                {filteredLinks.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.end}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${isActive
                                ? 'text-orange-600 bg-orange-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`${isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'} transition-colors`}>
                                    {link.icon}
                                </div>
                                <span>{link.name}</span>
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border-2 border-white shadow-sm font-bold">
                        {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName}</p>
                        <div className="flex items-center gap-1">
                            <UserIcon size={12} className="text-gray-400" />
                            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            {/* Toast Notification Container */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                toastClassName="rounded-xl shadow-lg border border-gray-100"
            />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar Navigation */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {sidebarContent}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Navbar */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0">

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <MenuIcon size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                            {filteredLinks.find(link => location.pathname === link.path || (link.end && location.pathname === '/dashboard'))?.name || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* User Identity Badge */}
                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 rounded-full shadow-sm">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="hidden sm:flex flex-col leading-tight">
                                <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">{user?.fullName}</span>
                                <span className="text-[10px] text-orange-600 font-semibold tracking-wide">
                                    ID: {user?.id || user?.userId || '—'} • {user?.role}
                                </span>
                            </div>
                            {/* Mobile: show only ID */}
                            <span className="sm:hidden text-[11px] font-bold text-orange-600">
                                #{user?.id || user?.userId || '—'}
                            </span>
                        </div>

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 text-gray-400 hover:text-orange-500 transition-colors bg-gray-50 rounded-full border border-gray-100 dark:bg-gray-800 dark:border-gray-700"
                        >
                            {isDarkMode ? "☀️" : "🌙"}
                        </button>
                        {/* Notification Bell stub */}
                        <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
