import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { FileText, Eye, CheckCircle2, Clock, Landmark, Coins } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const SalaryHistory = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/payroll');
            setHistory(res.data);
        } catch (error) {
            toast.error('Failed to load salary payment history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Salary History & Ledgers</h1>
                <p className="text-gray-500 text-sm mt-1">Review your monthly salary statements, payment histories, and download slips.</p>
            </div>

            {loading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                    <Spinner />
                </div>
            ) : history.length === 0 ? (
                <Card className="p-12 text-center border border-dashed border-gray-200">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4 animate-pulse" />
                    <p className="text-gray-500 font-semibold text-lg">No salary records found.</p>
                    <p className="text-gray-400 text-sm mt-1">Salary statements are compiled at the end of the month.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map(item => (
                        <Card key={item.id} className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 rounded-2xl relative overflow-hidden">
                            {/* Color indicator */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                                item.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}></div>

                            <div className="flex justify-between items-start pl-2">
                                <div>
                                    <h3 className="font-extrabold text-lg text-gray-900 tracking-tight">{months[item.month - 1]} {item.year}</h3>
                                    <span className="text-xs text-gray-400 block mt-0.5">Rec ID: #{item.id}</span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase ${
                                    item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {item.status}
                                </span>
                            </div>

                            {/* Summary Grid */}
                            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-4 rounded-xl text-center pl-4">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Present</span>
                                    <span className="font-bold text-sm text-gray-800 block mt-0.5">{item.presentDays} Days</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Overtime</span>
                                    <span className="font-bold text-sm text-gray-800 block mt-0.5">{item.overtimeHours} Hrs</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Deduction</span>
                                    <span className="font-bold text-sm text-rose-600 block mt-0.5">₹{item.deductions}</span>
                                </div>
                            </div>

                            {/* Final Takehome */}
                            <div className="pt-2 flex justify-between items-center text-sm pl-2">
                                <span className="text-gray-500 font-semibold">Net Take-Home Salary:</span>
                                <span className="text-lg font-black text-orange-600 font-mono">₹{item.netSalary.toFixed(2)}</span>
                            </div>

                            {item.paymentMethod && (
                                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-400 pl-2">
                                    <span className="flex items-center gap-1">
                                        <Landmark size={12} /> {item.paymentMethod}
                                    </span>
                                    <span className="font-mono">{item.transactionId || 'No Ref'}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 pl-2">
                                <button
                                    onClick={() => navigate(`/dashboard/payroll/details/${item.id}`)}
                                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-gray-150"
                                >
                                    <Eye size={14} /> View Details
                                </button>
                                <button
                                    onClick={() => navigate(`/dashboard/payroll/details/${item.id}`)}
                                    className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <FileText size={14} /> Print Slip
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SalaryHistory;
