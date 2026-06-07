import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { FileText, Search, Download, CheckCircle, Hourglass, CreditCard, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const SalaryReports = () => {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        status: ''
    });

    // Pay Modal
    const [payModal, setPayModal] = useState({
        open: false,
        salaryId: null,
        staffName: '',
        remaining: 0,
        amount: '',
        method: 'Bank Transfer',
        transactionId: ''
    });
    const [submittingPayment, setSubmittingPayment] = useState(false);

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('month', filter.month);
            params.append('year', filter.year);
            if (filter.status) params.append('status', filter.status);

            const res = await axiosClient.get(`/payroll?${params.toString()}`);
            setSalaries(res.data);
        } catch (error) {
            toast.error('Failed to load salary statements.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalaries();
    }, [filter.month, filter.year, filter.status]);

    const handleApprove = async (id) => {
        try {
            await axiosClient.put(`/payroll/approve/${id}`);
            toast.success('Salary statement approved!');
            fetchSalaries();
        } catch (error) {
            toast.error('Failed to approve salary statement.');
        }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        try {
            setSubmittingPayment(true);
            await axiosClient.put(`/payroll/pay/${payModal.salaryId}`, {
                amount: parseFloat(payModal.amount),
                paymentMethod: payModal.method,
                transactionId: payModal.transactionId
            });
            toast.success(`Disbursed ₹${payModal.amount} to ${payModal.staffName}!`);
            setPayModal({ open: false, salaryId: null, staffName: '', remaining: 0, amount: '', method: 'Bank Transfer', transactionId: '' });
            fetchSalaries();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to record payment.');
        } finally {
            setSubmittingPayment(false);
        }
    };

    const handleDownloadSlip = (item) => {
        const slipWindow = window.open('', '_blank');
        slipWindow.document.write(`
            <html>
                <head>
                    <title>Salary Slip - ${item.staffName}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #334155; line-height: 1.5; }
                        .container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
                        .header h1 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; }
                        .header p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
                        .meta-info { display: grid; grid-cols: 2; gap: 16px; margin-bottom: 24px; font-size: 14px; }
                        .meta-box { border: 1px solid #f1f5f9; border-radius: 8px; padding: 12px; background-color: #f8fafc; }
                        .title { font-weight: bold; color: #475569; }
                        .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
                        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #f1f5f9; }
                        .table th { color: #64748b; font-weight: 600; background-color: #f8fafc; }
                        .totals-box { margin-left: auto; width: 320px; border-top: 2px solid #e2e8f0; padding-top: 16px; font-size: 14px; }
                        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
                        .grand-total { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 8px; }
                        .footer { margin-top: 48px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div>
                                <h1>Enterprise Mess System</h1>
                                <p>Monthly Staff Payslip</p>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 800; font-size: 16px; color: #ea580c;">SALARY RECEIPT</div>
                                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Month: ${format(new Date(item.year, item.month - 1), 'MMMM yyyy')}</div>
                            </div>
                        </div>

                        <table class="table">
                            <tr>
                                <th>Staff Name</th><td><strong>${item.staffName}</strong></td>
                                <th>Department</th><td>${item.department}</td>
                            </tr>
                            <tr>
                                <th>Designation</th><td>${item.designation}</td>
                                <th>Salary Type</th><td>${item.salaryType}</td>
                            </tr>
                            <tr>
                                <th>Present Days</th><td>${item.presentDays} / ${item.totalWorkingDays} Days</td>
                                <th>Absent Days</th><td>${item.absentDays} Days</td>
                            </tr>
                        </table>

                        <h3 style="font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; color: #0f172a;">Earnings & Deductions</h3>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Components</th>
                                    <th style="text-align: right;">Earnings (₹)</th>
                                    <th style="text-align: right;">Deductions (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Basic / Attendance Salary</td>
                                    <td style="text-align: right;">₹${(item.totalSalary - item.overtimeAmount - item.bonus + item.deductions).toFixed(2)}</td>
                                    <td style="text-align: right;">-</td>
                                </tr>
                                <tr>
                                    <td>Overtime Amount (${item.overtimeHours} Hrs)</td>
                                    <td style="text-align: right;">₹${item.overtimeAmount.toFixed(2)}</td>
                                    <td style="text-align: right;">-</td>
                                </tr>
                                <tr>
                                    <td>Bonuses & Incentives</td>
                                    <td style="text-align: right; color: #16a34a;">+ ₹${item.bonus.toFixed(2)}</td>
                                    <td style="text-align: right;">-</td>
                                </tr>
                                <tr>
                                    <td>Penalties & Leave Deductions</td>
                                    <td style="text-align: right;">-</td>
                                    <td style="text-align: right; color: #dc2626;">- ₹${item.deductions.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="totals-box">
                            <div class="totals-row">
                                <span>Gross Calculated Salary</span>
                                <strong>₹${item.totalSalary.toFixed(2)}</strong>
                            </div>
                            <div class="totals-row">
                                <span>Amount Disbursed</span>
                                <span style="color: #16a34a; font-weight: bold;">₹${item.paidAmount.toFixed(2)}</span>
                            </div>
                            <div class="totals-row grand-total">
                                <span>Remaining Due</span>
                                <span style="color: #dc2626;">₹${item.remainingAmount.toFixed(2)}</span>
                            </div>
                            <div class="totals-row" style="font-size: 12px; color: #64748b; margin-top: 10px;">
                                <span>Payment Status</span>
                                <span style="font-weight: bold; text-transform: uppercase;">${item.status}</span>
                            </div>
                            ${item.paymentMethod ? `
                            <div class="totals-row" style="font-size: 12px; color: #64748b;">
                                <span>Method / Reference</span>
                                <span>${item.paymentMethod} • ${item.transactionId || 'N/A'}</span>
                            </div>` : ''}
                        </div>

                        <div class="footer">
                            This is an official system-generated record. Signature not required.<br/>
                            Generated on: ${new Date().toLocaleString()}
                        </div>
                    </div>
                </body>
            </html>
        `);
        slipWindow.document.close();
        setTimeout(() => slipWindow.print(), 500);
    };

    const handleExportCSV = () => {
        if (salaries.length === 0) {
            toast.info("No data to export");
            return;
        }
        const headers = ['Month', 'Year', 'Staff Name', 'Designation', 'Department', 'Working Days', 'Present Days', 'Base Salary', 'Bonus', 'Overtime Hours', 'Overtime Amount', 'Deductions', 'Total Salary', 'Paid', 'Remaining', 'Status'];
        const csvRows = [headers.join(',')];

        salaries.forEach(s => {
            const row = [
                s.month,
                s.year,
                `"${s.staffName}"`,
                `"${s.designation}"`,
                `"${s.department}"`,
                s.totalWorkingDays,
                s.presentDays,
                s.baseSalary,
                s.bonus,
                s.overtimeHours,
                s.overtimeAmount,
                s.deductions,
                s.totalSalary,
                s.paidAmount,
                s.remainingAmount,
                s.status
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `payroll_report_${filter.month}_${filter.year}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredSalaries = salaries.filter(s =>
        s.staffName.toLowerCase().includes(search.toLowerCase()) ||
        s.designation.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
    );

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Salary Reports & Ledger</h1>
                    <p className="text-gray-500 text-sm mt-1">Approve calculated salaries, log disbursements, and print staff payslips.</p>
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
                    <select
                        value={filter.status}
                        onChange={e => setFilter(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                        <option value="Partial">Partial</option>
                    </select>
                    <Button onClick={handleExportCSV} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold shadow-sm flex items-center gap-1.5">
                        <Download size={16} /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search staff, design, dept..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-sm"
                />
            </div>

            {/* List */}
            <Card className="overflow-hidden shadow-sm border border-gray-100 rounded-2xl">
                {loading ? (
                    <div className="py-16 flex justify-center"><Spinner /></div>
                ) : filteredSalaries.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 font-medium">No salary statements matching options.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="p-4">Staff / Dept</th>
                                    <th className="p-4">Present Days</th>
                                    <th className="p-4">Overtime Hours</th>
                                    <th className="p-4">Total Salary</th>
                                    <th className="p-4">Paid</th>
                                    <th className="p-4">Remaining</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700 bg-white">
                                {filteredSalaries.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{item.staffName}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{item.designation} • {item.department}</div>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-600">
                                            {item.presentDays} / {item.totalWorkingDays} Days
                                        </td>
                                        <td className="p-4 font-semibold text-gray-500">
                                            {item.overtimeHours} Hrs (₹{item.overtimeAmount})
                                        </td>
                                        <td className="p-4 font-bold text-gray-900">₹{item.totalSalary}</td>
                                        <td className="p-4 text-emerald-600 font-semibold">₹{item.paidAmount}</td>
                                        <td className="p-4 text-rose-600 font-bold">₹{item.remainingAmount}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                                                item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                                item.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                                                item.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <Button onClick={() => handleDownloadSlip(item)} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 p-2 shadow-sm" title="Print Slip">
                                                <FileText size={16} />
                                            </Button>

                                            {item.status === 'Draft' && (
                                                <Button onClick={() => handleApprove(item.id)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 shadow-sm">
                                                    <CheckCircle size={14} /> Approve
                                                </Button>
                                            )}

                                            {(item.status === 'Approved' || item.status === 'Partial') && (
                                                <Button onClick={() => setPayModal({
                                                    open: true,
                                                    salaryId: item.id,
                                                    staffName: item.staffName,
                                                    remaining: item.remainingAmount,
                                                    amount: item.remainingAmount,
                                                    method: 'Bank Transfer',
                                                    transactionId: ''
                                                })} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-sm">
                                                    <CreditCard size={14} /> Disburse
                                                </Button>
                                            )}

                                            {item.status === 'Paid' && (
                                                <span className="text-xs font-bold text-gray-400 block px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl select-none">Settled</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Pay Modal */}
            {payModal.open && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-6 border-0">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Disburse Salary</h2>
                        <p className="text-sm text-gray-400 mb-4">Record salary payout to <strong>{payModal.staffName}</strong>.</p>
                        
                        <form onSubmit={handlePay} className="space-y-4">
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center text-orange-900">
                                <span className="text-sm font-semibold">Remaining Due Salary:</span>
                                <span className="text-lg font-bold">₹{payModal.remaining}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Payment Amount (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    max={payModal.remaining}
                                    required
                                    value={payModal.amount}
                                    onChange={e => setPayModal(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Payment Method</label>
                                <select
                                    value={payModal.method}
                                    onChange={e => setPayModal(prev => ({ ...prev, method: e.target.value, transactionId: '' }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                                >
                                    <option>Bank Transfer</option>
                                    <option>UPI</option>
                                    <option>Cash</option>
                                </select>
                            </div>

                            {payModal.method !== 'Cash' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Transaction reference (Txn ID)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. TXN987654321"
                                        value={payModal.transactionId}
                                        onChange={e => setPayModal(prev => ({ ...prev, transactionId: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm font-mono"
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={() => setPayModal(prev => ({ ...prev, open: false }))}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submittingPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow-md border-0">
                                    {submittingPayment ? <Spinner size="sm" /> : 'Confirm Payment'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SalaryReports;
