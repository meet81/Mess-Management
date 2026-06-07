import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/BaseComponents';
import { Users, Utensils, CreditCard, MessageSquare, AlertTriangle, ShoppingCart, CheckCircle, Package, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, icon, colorClass, borderClass }) => (
    <Card className={`p-6 border-l-4 ${borderClass} hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
        </div>
    </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm z-50 relative">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="font-medium">
                        {entry.name}: {entry.value}
                    </p>
                ))}
                {(data.expectedBreakfast !== undefined) && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-gray-600 text-xs space-y-1">
                        <p><span className="font-semibold text-gray-700">Breakfast (Expected):</span> {data.expectedBreakfast}</p>
                        <p><span className="font-semibold text-gray-700">Lunch (Expected):</span> {data.expectedLunch}</p>
                        <p><span className="font-semibold text-gray-700">Dinner (Expected):</span> {data.expectedDinner}</p>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const Home = () => {
    const { user } = useAuth();
    
    // Overview Headcount Stats
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalStaff: 0,
        studentsOnLeave: 0,
        staffOnLeave: 0,
        expectedBreakfast: 0,
        expectedLunch: 0,
        expectedDinner: 0,
        expectedStaffToday: 0,
        totalRevenue: 0,
        totalDues: 0,
        totalPaid: 0, 
        feedbackCount: 0,
        todayMenu: null
    });

    const [loading, setLoading] = useState(true);
    const [hasAnyChartData, setHasAnyChartData] = useState(false); 
    const [loadingChart, setLoadingChart] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [chartData, setChartData] = useState([]);

    // Smart Kitchen Specific Stats (for Admin/Staff)
    const [kitchenStats, setKitchenStats] = useState({
        todaysPlans: [],
        lowStockItems: [],
        pendingOrders: [],
        todayUsedQuantity: 0,
        todayWastedQuantity: 0,
        availableStock: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                setLoadingChart(true);

                const statsRes = await axiosClient.get(`/dashboard/today-stats?date=${selectedDate}`);
                setStats(statsRes.data);

                let currentChartData = [];
                let hasData = false;

                if (user.role === 'Admin' || user.role === 'Staff') {
                    const weeklyRes = await axiosClient.get('/dashboard/weekly-total-meals');
                    currentChartData = weeklyRes.data;
                    hasData = true;

                    // Fetch smart kitchen stats
                    const kitchenRes = await axiosClient.get(`/dashboard/smart-kitchen-stats?date=${selectedDate}`);
                    setKitchenStats(kitchenRes.data);
                } else {
                    const weeklyRes = await axiosClient.get('/dashboard/my-weekly-attendance');
                    currentChartData = weeklyRes.data.map((d, i) => ({
                        name: d.name,
                        count: d.meals,
                        fill: i % 2 === 0 ? '#93C5FD' : '#3B82F6'
                    }));
                    hasData = currentChartData.some(day => day.count > 0);
                }

                setChartData(currentChartData);
                setHasAnyChartData(hasData);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
                toast.error("Could not load dashboard data.");
            } finally {
                setLoading(false);
                setLoadingChart(false);
            }
        };
        fetchDashboardData();
    }, [selectedDate, user]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Here is the mess meal planning overview based on expected turnout.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-sm font-medium">
                        <span className="text-gray-600">Overview Date:</span>
                        <input
                            type="date"
                            className="bg-transparent border-none outline-none text-gray-900 cursor-pointer"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stat Cards Row */}
            {user?.role === 'Admin' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Breakfast Expected"
                        value={loading ? "..." : stats.expectedBreakfast}
                        icon={<Utensils size={24} className="text-amber-600" />}
                        colorClass="bg-amber-100"
                        borderClass="border-amber-500"
                    />
                    <StatCard
                        title="Lunch Expected"
                        value={loading ? "..." : stats.expectedLunch}
                        icon={<Utensils size={24} className="text-orange-600" />}
                        colorClass="bg-orange-100"
                        borderClass="border-orange-500"
                    />
                    <StatCard
                        title="Dinner Expected"
                        value={loading ? "..." : stats.expectedDinner}
                        icon={<Utensils size={24} className="text-indigo-600" />}
                        colorClass="bg-indigo-100"
                        borderClass="border-indigo-500"
                    />
                    <StatCard
                        title="Total Students"
                        value={loading ? "..." : stats.totalStudents}
                        icon={<Users size={24} className="text-blue-600" />}
                        colorClass="bg-blue-100"
                        borderClass="border-blue-500"
                    />
                    <StatCard
                        title="Students On Leave Today"
                        value={loading ? "..." : stats.studentsOnLeave}
                        icon={<TrendingUp size={24} className="text-red-600 transform rotate-180" />}
                        colorClass="bg-red-100"
                        borderClass="border-red-500"
                    />
                    <StatCard
                        title="Total Staff"
                        value={loading ? "..." : stats.totalStaff}
                        icon={<Users size={24} className="text-emerald-600" />}
                        colorClass="bg-emerald-100"
                        borderClass="border-emerald-500"
                    />
                    <StatCard
                        title="Staff Expected"
                        value={loading ? "..." : stats.expectedStaffToday}
                        icon={<Utensils size={24} className="text-emerald-600" />}
                        colorClass="bg-emerald-100"
                        borderClass="border-emerald-500"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={loading ? "..." : `₹${stats.totalRevenue}`}
                        icon={<CreditCard size={24} className="text-emerald-600" />}
                        colorClass="bg-emerald-100"
                        borderClass="border-emerald-500"
                    />
                </div>
            ) : user?.role === 'Staff' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard
                        title="Today's Expected Headcount"
                        value={loading ? "..." : stats.expectedLunch}
                        icon={<Users size={24} className="text-blue-600" />}
                        colorClass="bg-blue-100"
                        borderClass="border-blue-500"
                    />
                    <StatCard
                        title="Recent Feedback"
                        value={loading ? "..." : stats.feedbackCount}
                        icon={<MessageSquare size={24} className="text-purple-600" />}
                        colorClass="bg-purple-100"
                        borderClass="border-purple-500"
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Today's Expected Headcount"
                        value={loading ? "..." : stats.expectedLunch}
                        icon={<Users size={24} className="text-blue-600" />}
                        colorClass="bg-blue-100"
                        borderClass="border-blue-500"
                    />
                    <StatCard
                        title="My Dues"
                        value={loading ? "..." : stats.totalDues > 0 ? `₹${stats.totalDues}` : "No Dues"}
                        icon={<CreditCard size={24} className={stats.totalDues > 0 ? "text-rose-600" : "text-emerald-600"} />}
                        colorClass={stats.totalDues > 0 ? "bg-rose-100" : "bg-emerald-100"}
                        borderClass={stats.totalDues > 0 ? "border-rose-500" : "border-emerald-500"}
                    />
                    <StatCard
                        title="Recent Feedback"
                        value={loading ? "..." : stats.feedbackCount}
                        icon={<MessageSquare size={24} className="text-purple-600" />}
                        colorClass="bg-purple-100"
                        borderClass="border-purple-500"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                            {user?.role === 'Admin' || user?.role === 'Staff'
                                ? "Weekly Overview (Last 7 Days)"
                                : "Your Attendance (Last 7 Days)"}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {user?.role === 'Admin' || user?.role === 'Staff'
                                ? "Meals prepared vs consumed, and attendance counts."
                                : "Total meals you attended over the past week."}
                        </p>
                    </div>
                    <div className="h-72 w-full">
                        {loadingChart ? (
                            <div className="flex items-center justify-center h-full text-gray-400"><Utensils className="animate-pulse" size={48} /></div>
                        ) : (
                            !hasAnyChartData ? (
                                <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                                    {user?.role === 'Student'
                                        ? "Your attendance graph will appear here once your meal attendance is recorded."
                                        : "No data available."}
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    {user?.role === 'Admin' || user?.role === 'Staff' ? (
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#4B5563' }} />
                                            <Bar dataKey="expected" fill="#FBBF24" name="Meals Prepared" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="actual" fill="#10B981" name="Meals Consumed" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    ) : (
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
                                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="count" name="Meals Attended" radius={[4, 4, 0, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            )
                        )}
                    </div>
                </Card>

                <Card className="p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Role Information</h3>
                    <div className="flex-1 space-y-4">
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                            <h4 className="font-semibold text-orange-800 mb-1">Your Access Level: {user?.role}</h4>
                            <p className="text-sm text-orange-600">
                                {user?.role === 'Admin'
                                    ? "You have full control to manage menus, track attendance, enforce payments, and review feedback."
                                    : user?.role === 'Staff'
                                        ? "You can view the menu, manage daily attendance logs, and submit feedback."
                                        : "You can view the weekly menu, track your attendance, pay outstanding dues, and submit feedback."}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="font-medium text-gray-700 mb-2">
                                {selectedDate === new Date().toISOString().split('T')[0]
                                    ? "Today's"
                                    : `${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}'s`} Menu Highlight
                            </h4>
                            {stats.todayMenu ? (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 space-y-2">
                                    <div><span className="font-semibold text-gray-800">Breakfast:</span> {stats.todayMenu.breakfast}</div>
                                    <div><span className="font-semibold text-gray-800">Lunch:</span> {stats.todayMenu.lunch}</div>
                                    <div><span className="font-semibold text-gray-800">Dinner:</span> {stats.todayMenu.dinner}</div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500 italic">
                                    {loading ? "Loading menu..." : "Menu not configured for this date."}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Smart Kitchen Summary Dashboard Section (Admin/Staff only) */}
            {(user?.role === 'Admin' || user?.role === 'Staff') && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Kitchen Alerts</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                                <span className="text-gray-600 font-medium">Today Required Ingredients</span>
                                <b className="text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-100">{kitchenStats.todaysPlans?.length || 0}</b>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                                <span className="text-gray-600 font-medium">Low Stock Items</span>
                                <b className={`px-2 py-0.5 rounded border ${kitchenStats.lowStockItems?.length > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-white text-gray-900 border-gray-100'}`}>
                                    {kitchenStats.lowStockItems?.length || 0}
                                </b>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                                <span className="text-gray-600 font-medium">Pending Vendor Orders</span>
                                <b className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{kitchenStats.pendingOrders?.length || 0}</b>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                                <span className="text-gray-600 font-medium">Today Used Quantity</span>
                                <b className="text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">{(kitchenStats.todayUsedQuantity || 0).toFixed(2)} kg/L</b>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                                <span className="text-gray-600 font-medium">Wasted Quantity</span>
                                <b className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">{(kitchenStats.todayWastedQuantity || 0).toFixed(2)} kg/L</b>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                                <span className="text-gray-600 font-medium">Available Stock Items</span>
                                <b className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{kitchenStats.availableStock?.filter(i => i.quantity > 0).length || 0}</b>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 lg:col-span-2 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Today's Required Ingredients & Shortages</h3>
                        <div className="overflow-y-auto max-h-72 border border-gray-100 rounded-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-semibold sticky top-0 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-2">Ingredient</th>
                                        <th className="px-4 py-2">Meal</th>
                                        <th className="px-4 py-2 text-right">Required</th>
                                        <th className="px-4 py-2 text-right">Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kitchenStats.todaysPlans?.map((p, idx) => {
                                        const matchedStock = kitchenStats.availableStock?.find(i => i.inventoryId === p.ingredientId);
                                        const qty = matchedStock ? matchedStock.quantity : 0;
                                        const isLow = qty < p.requiredQuantity;
                                        return (
                                            <tr key={idx} className={`border-b border-gray-50 ${isLow ? 'bg-red-50/20' : ''}`}>
                                                <td className="px-4 py-3 font-bold text-gray-800">{p.ingredientName}</td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{p.mealType}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-orange-600">{Number(p.requiredQuantity).toFixed(2)} {p.unit}</td>
                                                <td className={`px-4 py-3 text-right font-medium ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {Number(qty).toFixed(2)} {p.unit}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!kitchenStats.todaysPlans || kitchenStats.todaysPlans.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500 italic">
                                                No ingredients required for this date.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="mt-6">
                    <Card className="p-6 space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Tomorrow's Vendor Suggestions</h3>
                            <p className="text-xs text-gray-500">Auto-calculated restock recommendations based on tomorrow's meal plans.</p>
                        </div>
                        <div className="overflow-y-auto max-h-64 border border-gray-100 rounded-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-semibold sticky top-0 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-2">Ingredient</th>
                                        <th className="px-4 py-2 text-right">Required Tomorrow</th>
                                        <th className="px-4 py-2 text-right">Stock</th>
                                        <th className="px-4 py-2 text-right">Safety</th>
                                        <th className="px-4 py-2 text-right font-bold text-orange-600">Suggested Order</th>
                                        <th className="px-4 py-2">Vendor</th>
                                        <th className="px-4 py-2 text-right">Est. Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kitchenStats.tomorrowSuggestions?.map((s, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-bold text-gray-800">{s.vegetableName || s.ingredientName}</td>
                                            <td className="px-4 py-3 text-right">{Number(s.tomorrowRequiredQuantity || s.nextDayRequiredQuantity || 0).toFixed(2)} {s.unit}</td>
                                            <td className="px-4 py-3 text-right">{Number(s.availableStock || 0).toFixed(2)} {s.unit}</td>
                                            <td className="px-4 py-3 text-right text-gray-550">{Number(s.safetyStock || 0).toFixed(2)} {s.unit}</td>
                                            <td className="px-4 py-3 text-right font-bold text-orange-600">
                                                {Number(s.suggestedOrderQuantity || s.suggestedQuantity || 0) > 0 ? (
                                                    <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100 text-xs font-bold">
                                                        {Number(s.suggestedOrderQuantity || s.suggestedQuantity).toFixed(2)} {s.unit}
                                                    </span>
                                                ) : '0.00'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-xs">{s.preferredVendorName || 'None'}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                                ₹{Number(s.estimatedCost || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!kitchenStats.tomorrowSuggestions || kitchenStats.tomorrowSuggestions.length === 0) && (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500 italic">
                                                No restocking suggestions for tomorrow.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                </>
            )}
        </div>
    );
};

export default Home;
