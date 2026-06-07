import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { FileText, Printer, ArrowLeft, ShieldAlert, Award, Calendar, Coins, Landmark } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const SalaryDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get(`/payroll/${id}`);
            setDetails(res.data);
        } catch (error) {
            toast.error('Failed to load salary details.');
            navigate('/dashboard/payroll');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!details) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-150 pb-4 print:hidden">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={16} /> Back to List
                </button>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-1.5 shadow-sm border-0">
                        <Printer size={16} /> Print Payslip
                    </Button>
                </div>
            </div>

            <Card className="p-8 bg-white border border-gray-100 shadow-xl rounded-3xl relative print:border-0 print:shadow-none print:p-0">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-amber-500 rounded-t-3xl print:hidden"></div>

                {/* Company & Document Header */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-6 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Enterprise Mess Systems</h2>
                        <p className="text-gray-500 text-xs mt-1">Official Monthly Salary Slip</p>
                    </div>
                    <div className="text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                            details.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                            details.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                            details.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {details.status}
                        </span>
                        <div className="text-xs text-gray-400 mt-2 font-mono">Period: {format(new Date(details.year, details.month - 1), 'MMMM yyyy')}</div>
                    </div>
                </div>

                {/* Staff Detail Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mb-8">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Employee Details</span>
                        <span className="font-extrabold text-gray-950 block mt-1">{details.staffName}</span>
                        <span className="text-xs text-gray-500 block mt-0.5">ID: #{details.userId}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Position / Dept</span>
                        <span className="font-bold text-gray-800 block mt-1">{details.designation}</span>
                        <span className="text-xs text-gray-500 block mt-0.5">{details.department}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Employment Metadata</span>
                        <span className="font-bold text-gray-800 block mt-1">{details.employmentType}</span>
                        <span className="text-xs text-orange-500 font-bold block mt-0.5">{details.salaryType}</span>
                    </div>
                </div>

                {/* Account Details Box */}
                {(details.bankAccountDetails || details.upiId) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100 rounded-xl p-4 mb-8 bg-white/50 text-xs text-gray-500">
                        {details.bankAccountDetails && (
                            <div className="flex gap-2 items-center">
                                <Landmark size={14} className="text-gray-400" />
                                <span>Bank details: {details.bankAccountDetails}</span>
                            </div>
                        )}
                        {details.upiId && (
                            <div className="flex gap-2 items-center">
                                <Coins size={14} className="text-gray-400" />
                                <span>UPI Address: {details.upiId}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Earnings vs Deductions Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-gray-100 pb-8">
                    {/* Earnings */}
                    <div>
                        <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-1.5">
                            <Award className="text-emerald-500" size={16} /> Earnings Component
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Basic Rate Salary</span><span className="font-mono font-semibold">₹{details.baseSalary.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Attendance Salary ({details.presentDays} Days)</span><span className="font-mono font-semibold">₹{(details.grossSalary - details.overtimeAmount - details.bonus - details.incentive - details.festivalBonus).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Overtime Pay ({details.overtimeHours} Hrs)</span><span className="font-mono font-semibold">₹{details.overtimeAmount.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Bonuses & Tips</span><span className="font-mono font-semibold text-emerald-600">+ ₹{details.bonus.toFixed(2)}</span></div>
                            {details.incentive > 0 && <div className="flex justify-between"><span className="text-gray-500">Incentive Allowance</span><span className="font-mono font-semibold text-emerald-600">+ ₹{details.incentive.toFixed(2)}</span></div>}
                            {details.festivalBonus > 0 && <div className="flex justify-between"><span className="text-gray-500">Festival Bonus</span><span className="font-mono font-semibold text-emerald-600">+ ₹{details.festivalBonus.toFixed(2)}</span></div>}
                            <div className="flex justify-between border-t pt-2 font-bold text-gray-800"><span className="text-gray-600">Gross Monthly Salary</span><span className="font-mono">₹{details.grossSalary.toFixed(2)}</span></div>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div>
                        <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-1.5">
                            <ShieldAlert className="text-rose-500" size={16} /> Deductions Component
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Absent / Unpaid Leave Days ({details.absentDays + details.leaveDays} Days)</span><span className="font-mono font-semibold text-rose-600">- ₹{details.leaveDeduction.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Late Entries / Incident Penalties</span><span className="font-mono font-semibold text-rose-600">- ₹{details.latePenalty.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Outstanding Advance Recoveries</span><span className="font-mono font-semibold text-rose-600">- ₹{details.advanceRecovery.toFixed(2)}</span></div>
                            {details.otherDeductions > 0 && <div className="flex justify-between"><span className="text-gray-500">Miscellaneous Deductions</span><span className="font-mono font-semibold text-rose-600">- ₹{details.otherDeductions.toFixed(2)}</span></div>}
                            <div className="flex justify-between border-t pt-2 font-bold text-gray-800"><span className="text-gray-600">Total Deductions</span><span className="font-mono">₹{details.deductions.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>

                {/* Final Net Calculation Box */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                    <div>
                        <span className="text-sm font-bold text-orange-900">Net Salary Paid (Take-Home)</span>
                        <div className="text-xs text-orange-700/80 mt-1">Calculated as Net Salary = Gross Salary - Total Deduction.</div>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-orange-950 font-mono">₹{details.netSalary.toFixed(2)}</span>
                    </div>
                </div>

                {/* Footer notes */}
                <div className="mt-8 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4">
                    This document is generated automatically by Mess Management System. Unauthorized reproduction is strictly prohibited.<br/>
                    Generated on: {new Date().toLocaleString()}
                </div>
            </Card>
        </div>
    );
};

export default SalaryDetails;
