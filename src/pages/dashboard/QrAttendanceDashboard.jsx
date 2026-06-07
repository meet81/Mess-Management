import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { Coffee, Utensils, Moon, RefreshCw, Users, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const QrAttendanceDashboard = () => {
    const [liveData, setLiveData] = useState({
        breakfastCount: 0,
        lunchCount: 0,
        dinnerCount: 0,
        studentCount: 0,
        staffCount: 0,
        remainingExpectedCount: 0,
        recentScans: []
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLiveStats = async () => {
        try {
            setRefreshing(true);
            const res = await axiosClient.get('/qr-attendance/live');
            setLiveData(res.data);
        } catch (error) {
            toast.error('Failed to fetch live headcount statistics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLiveStats();
        // Setup polling every 15 seconds to simulate real-time updates
        const interval = setInterval(fetchLiveStats, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">QR Attendance Live Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time attendance logs, meal counter stats, and expected headcount balances.</p>
                </div>
                <Button onClick={fetchLiveStats} disabled={refreshing} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm font-semibold flex items-center gap-1.5">
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Refreshing...' : 'Refresh Live Data'}
                </Button>
            </div>

            {loading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                    <Spinner />
                </div>
            ) : (
                <>
                    {/* Live Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Card className="p-6 bg-white border border-t-4 border-t-amber-400 border-gray-100 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Breakfast Count</span>
                                <span className="text-3xl font-black text-gray-900 mt-1 block">{liveData.breakfastCount}</span>
                                <span className="text-[10px] text-gray-400 mt-1 block">Consumed today</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-amber-50 text-amber-500">
                                <Coffee size={28} />
                            </div>
                        </Card>

                        <Card className="p-6 bg-white border border-t-4 border-t-orange-500 border-gray-100 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Lunch Count</span>
                                <span className="text-3xl font-black text-gray-900 mt-1 block">{liveData.lunchCount}</span>
                                <span className="text-[10px] text-gray-400 mt-1 block">Consumed today</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-orange-50 text-orange-500">
                                <Utensils size={28} />
                            </div>
                        </Card>

                        <Card className="p-6 bg-white border border-t-4 border-t-indigo-500 border-gray-100 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Dinner Count</span>
                                <span className="text-3xl font-black text-gray-900 mt-1 block">{liveData.dinnerCount}</span>
                                <span className="text-[10px] text-gray-400 mt-1 block">Consumed today</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-500">
                                <Moon size={28} />
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Attendance Breakdown (1 col) */}
                        <Card className="p-6 bg-white border border-gray-100 shadow-sm lg:col-span-1 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Headcount Breakdown</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Users className="text-blue-500" size={20} />
                                        <span className="font-semibold text-gray-700 text-sm">Students Present</span>
                                    </div>
                                    <span className="text-lg font-black text-blue-700">{liveData.studentCount}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="text-emerald-500" size={20} />
                                        <span className="font-semibold text-gray-700 text-sm">Staff Present</span>
                                    </div>
                                    <span className="text-lg font-black text-emerald-700">{liveData.staffCount}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-orange-50/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Utensils className="text-orange-500" size={20} />
                                        <span className="font-semibold text-gray-700 text-sm">Remaining Expected</span>
                                    </div>
                                    <span className="text-lg font-black text-orange-700">{liveData.remainingExpectedCount}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Recent Scans (2 cols) */}
                        <Card className="p-6 bg-white border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Peak Activity & Recent Scans</h3>
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                            <th className="pb-3 pr-4">User</th>
                                            <th className="pb-3 pr-4">Role</th>
                                            <th className="pb-3 pr-4">Meal Type</th>
                                            <th className="pb-3 pr-4">Scan Time</th>
                                            <th className="pb-3 pr-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-50 text-gray-700 bg-white">
                                        {liveData.recentScans.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-400 font-semibold">No scans processed today yet.</td>
                                            </tr>
                                        ) : (
                                            liveData.recentScans.map(scan => (
                                                <tr key={scan.attendanceId} className="hover:bg-gray-50/50">
                                                    <td className="py-3 font-semibold text-gray-900">{scan.userName}</td>
                                                    <td className="py-3 text-xs text-gray-500">{scan.role}</td>
                                                    <td className="py-3 font-medium">{scan.mealType}</td>
                                                    <td className="py-3 font-mono font-semibold">{scan.attendanceTime}</td>
                                                    <td className="py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                            scan.verificationStatus === 'Verified'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}>
                                                            {scan.verificationStatus === 'Verified' ? (
                                                                <CheckCircle2 size={10} />
                                                            ) : (
                                                                <XCircle size={10} />
                                                            )}
                                                            {scan.verificationStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
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

export default QrAttendanceDashboard;
