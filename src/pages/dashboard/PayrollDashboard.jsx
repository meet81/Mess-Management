import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { Banknote, Users, Clock, AlertCircle, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const PayrollDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalGenerated: 0,
        totalPaid: 0,
        totalRemaining: 0,
        overtimeCost: 0,
        departmentSummary: [],
        designationSummary: [],
        pendingPayments: []
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get(`/payroll/reports?month=${filter.month}&year=${filter.year}`);
            setStats(res.data);
        } catch (error) {
            toast.error('Failed to load payroll reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [filter.month, filter.year]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Payroll Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor salary expenses, overtime costs, and track pending disbursements.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select
                        value={filter.month}
                        onChange={e => setFilter(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                        {months.map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={filter.year}
                        onChange={e => setFilter(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <Button onClick={() => navigate('/dashboard/payroll/generator')} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md border-0 hover:shadow-lg transition-all">
                        Salary Generator
                    </Button>
                    <Button onClick={() => navigate('/dashboard/payroll/reports')} variant="secondary" className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold shadow-sm">
                        Payroll Reports
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                    <Spinner />
                </div>
            ) : (
                <>
                    {/* Metrics grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <Card className="p-6 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-orange-50 text-orange-500">
                                <Banknote size={24} />
                            </div>
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Monthly Total</span>
                                <span className="text-2xl font-extrabold text-gray-900 mt-1 block">₹{stats.totalGenerated.toLocaleString('en-IN')}</span>
                            </div>
                        </Card>

                        <Card className="p-6 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-500">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Amount Paid</span>
                                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">₹{stats.totalPaid.toLocaleString('en-IN')}</span>
                            </div>
                        </Card>

                        <Card className="p-6 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-rose-50 text-rose-500">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Remaining Due</span>
                                <span className="text-2xl font-extrabold text-rose-600 mt-1 block">₹{stats.totalRemaining.toLocaleString('en-IN')}</span>
                            </div>
                        </Card>

                        <Card className="p-6 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-amber-50 text-amber-500">
                                <Clock size={24} />
                            </div>
                            <div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Overtime Cost</span>
                                <span className="text-2xl font-extrabold text-amber-600 mt-1 block">₹{stats.overtimeCost.toLocaleString('en-IN')}</span>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Department Expense List */}
                        <Card className="p-6 bg-white border border-gray-100 shadow-sm lg:col-span-1 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Department-wise Salary</h3>
                            <div className="flex-1 space-y-4">
                                {stats.departmentSummary.length === 0 ? (
                                    <p className="text-gray-500 text-sm py-6 text-center">No department summaries available.</p>
                                ) : (
                                    stats.departmentSummary.map(dept => (
                                        <div key={dept.department} className="space-y-1.5">
                                            <div className="flex justify-between text-sm font-semibold text-gray-800">
                                                <span>{dept.department}</span>
                                                <span>₹{dept.totalSalary.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-orange-400 to-amber-500 h-2 rounded-full"
                                                    style={{ width: `${(dept.totalSalary / (stats.totalGenerated || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <span>{dept.count} Staff Members</span>
                                                <span>Paid: ₹{dept.paid.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        {/* Pending Payments List */}
                        <Card className="p-6 bg-white border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Pending salary payments</h3>
                                <button onClick={() => navigate('/dashboard/payroll/reports')} className="text-orange-500 hover:text-orange-600 text-sm font-semibold flex items-center gap-1">
                                    Disburse Salaries <ArrowRight size={16} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                            <th className="pb-3 pr-4">Staff Name</th>
                                            <th className="pb-3 pr-4">Total Salary</th>
                                            <th className="pb-3 pr-4">Paid</th>
                                            <th className="pb-3 pr-4">Pending</th>
                                            <th className="pb-3 pr-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-50 text-gray-700">
                                        {stats.pendingPayments.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-500 font-medium">All salary payments settled for this month!</td>
                                            </tr>
                                        ) : (
                                            stats.pendingPayments.map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 font-semibold text-gray-900">{p.staffName}</td>
                                                    <td className="py-3">₹{p.totalSalary.toLocaleString('en-IN')}</td>
                                                    <td className="py-3 text-emerald-600">₹{p.paidAmount.toLocaleString('en-IN')}</td>
                                                    <td className="py-3 text-rose-600 font-bold">₹{p.remainingAmount.toLocaleString('en-IN')}</td>
                                                    <td className="py-3">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                            p.status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                                        }`}>
                                                            {p.status}
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

export default PayrollDashboard;
