import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { Banknote, CheckCircle2, Clock, CalendarDays, Search, Download, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Salary = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [filters, setFilters] = useState({ month: '', year: '' });

    // Generate Modal (Admin)
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [genData, setGenData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), perDaySalary: 500, bonus: 0, deductions: 0 });
    const [generating, setGenerating] = useState(false);

    // Pay Modal (Admin)
    const [payModal, setPayModal] = useState({ open: false, salaryId: null, remaining: 0, amount: '', method: 'Bank Transfer', transactionId: '' });

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            let endpoint = isAdmin ? '/salary/all' : '/salary/my';
            if (isAdmin) {
                const params = new URLSearchParams();
                if (filters.month) params.append('month', filters.month);
                if (filters.year) params.append('year', filters.year);
                const query = params.toString();
                if (query) endpoint += `?${query}`;
            }
            const res = await axiosClient.get(endpoint);
            setSalaries(res.data);
            setCurrentPage(1);
        } catch (error) {
            toast.error('Failed to load salary records.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadSlip = (salary) => {
        const slipWindow = window.open('', '_blank');
        slipWindow.document.write(`
            <html>
                <head>
                    <title>Salary Slip - ${format(new Date(salary.year, salary.month - 1), 'MMMM yyyy')}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { margin: 0; color: #1e3a8a; font-size: 28px; }
                        .header p { margin: 5px 0 0; color: #64748b; }
                        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .details-table th, .details-table td { padding: 12px; border: 1px solid #e2e8f0; text-align: left; }
                        .details-table th { background-color: #f8fafc; color: #475569; width: 40%; }
                        .totals { width: 50%; float: right; border-collapse: collapse; }
                        .totals th, .totals td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; }
                        .totals .final { font-size: 18px; font-weight: bold; }
                        .footer { margin-top: 100px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Mess Management System</h1>
                        <p>Official Salary Slip - ${format(new Date(salary.year, salary.month - 1), 'MMMM yyyy')}</p>
                    </div>
                    <table class="details-table">
                        <tr><th>Staff Name</th><td>${salary.userName || user?.fullName}</td></tr>
                        <tr><th>Month / Year</th><td>${format(new Date(salary.year, salary.month - 1), 'MMMM yyyy')}</td></tr>
                        <tr><th>Total Working Days</th><td>${salary.totalWorkingDays}</td></tr>
                        <tr><th>Present Days</th><td>${salary.presentDays}</td></tr>
                        <tr><th>Absent Days</th><td>${salary.absentDays}</td></tr>
                        <tr><th>Per Day Rate</th><td>₹${salary.perDaySalary}</td></tr>
                        ${salary.bonus > 0 ? `<tr><th>Bonus Added</th><td style="color: #059669;">+ ₹${salary.bonus}</td></tr>` : ''}
                        ${salary.deductions > 0 ? `<tr><th>Deductions</th><td style="color: #e11d48;">- ₹${salary.deductions}</td></tr>` : ''}
                    </table>
                    <table class="totals">
                        <tr><th>Total Generated Salary</th><td>₹${salary.totalSalary}</td></tr>
                        <tr><th>Amount Paid</th><td>₹${salary.paidAmount}</td></tr>
                        <tr><th style="color: #e11d48;">Remaining Due</th><td style="color: #e11d48; font-weight: bold;">₹${salary.remainingAmount}</td></tr>
                        <tr><th>Status</th><td class="final" style="color: ${salary.status === 'Paid' ? '#059669' : '#d97706'}">${salary.status}</td></tr>
                        ${salary.paymentMethod ? `<tr><th>Payment Method</th><td>${salary.paymentMethod}</td></tr>` : ''}
                        ${salary.transactionId ? `<tr><th>Transaction ID</th><td>${salary.transactionId}</td></tr>` : ''}
                    </table>
                    <div style="clear: both;"></div>
                    <div class="footer">
                        This is a system-generated document and does not require a physical signature.<br/>
                        Generated on: ${new Date().toLocaleString()}
                    </div>
                </body>
            </html>
        `);
        slipWindow.document.close();
        setTimeout(() => slipWindow.print(), 500);
    };

    useEffect(() => {
        fetchSalaries();
    }, [isAdmin, filters.month, filters.year]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        try {
            setGenerating(true);
            await axiosClient.post('/salary/generate', {
                month: parseInt(genData.month),
                year: parseInt(genData.year),
                perDaySalary: parseFloat(genData.perDaySalary),
                bonus: parseFloat(genData.bonus || 0),
                deductions: parseFloat(genData.deductions || 0)
            });
            toast.success('Salaries generated successfully.');
            setIsGenerateOpen(false);
            fetchSalaries();
        } catch (error) {
            toast.error('Failed to generate salaries.');
        } finally {
            setGenerating(false);
        }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post(`/salary/pay/${payModal.salaryId}`, {
                amount: parseFloat(payModal.amount),
                paymentMethod: payModal.method,
                transactionId: payModal.transactionId
            });
            toast.success(`Salary payment processed!`);
            setPayModal({ open: false, salaryId: null, remaining: 0, amount: '', method: 'Bank Transfer', transactionId: '' });
            fetchSalaries();
        } catch (error) {
            toast.error(error.response?.data || 'Payment processing failed.');
        }
    };

    const handleExportExcel = () => {
        if (filteredSalaries.length === 0) {
            toast.info("No data to export");
            return;
        }
        const headers = ['Month', 'Year', 'Staff Name', 'Working Days', 'Present', 'Absent', 'Bonus', 'Deductions', 'Total Salary', 'Paid', 'Remaining', 'Status'];
        const csvRows = [headers.join(',')];
        filteredSalaries.forEach(s => {
            const row = [s.month, s.year, `"${s.userName || ''}"`, s.totalWorkingDays, s.presentDays, s.absentDays, s.bonus, s.deductions, s.totalSalary, s.paidAmount, s.remainingAmount, s.status];
            csvRows.push(row.join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `salary_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const filteredSalaries = salaries.filter(s =>
        (s.userName && s.userName.toLowerCase().includes(search.toLowerCase())) ||
        s.month.toString().includes(search)
    );

    const totalPages = Math.ceil(filteredSalaries.length / itemsPerPage);
    const paginatedSalaries = filteredSalaries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in p-2 sm:p-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Salary</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isAdmin ? "Manage and disburse staff salaries based on attendance." : "View your monthly salary statements."}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {isAdmin && (
                        <>
                            <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Months</option>
                                {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{format(new Date(2000, i, 1), 'MMMM')}</option>)}
                            </select>
                            <input type="number" placeholder="Year" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} className="w-full sm:w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

                            <div className="relative flex-1 sm:w-48">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <Button onClick={() => setIsGenerateOpen(true)} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap shadow-md">
                                <CalendarDays size={18} className="mr-2" />
                                Generate Salaries
                            </Button>
                            <Button onClick={handleExportExcel} variant="secondary" className="whitespace-nowrap shadow-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
                                <Download size={18} className="mr-2 text-gray-500" />
                                Export CSV
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Staff View - Cards */}
            {!isAdmin && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? <div className="col-span-full flex justify-center py-12"><Spinner /></div> : paginatedSalaries.length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Banknote size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium text-lg">No salary records found.</p>
                            </div>
                        ) : paginatedSalaries.map(salary => (
                            <Card key={salary.id} className="p-6 flex flex-col gap-4 bg-white border-t-4 border-t-blue-500 shadow-sm">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                    <h3 className="font-bold text-lg text-gray-900">{format(new Date(salary.year, salary.month - 1), 'MMMM yyyy')}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${salary.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : salary.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {salary.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 p-4 rounded-xl mb-1">
                                    <div><p className="text-gray-500 text-xs">Working</p><p className="font-semibold">{salary.totalWorkingDays}</p></div>
                                    <div><p className="text-gray-500 text-xs">Present</p><p className="font-semibold text-emerald-600">{salary.presentDays}</p></div>
                                    <div><p className="text-gray-500 text-xs">Absent</p><p className="font-semibold text-rose-600">{salary.absentDays}</p></div>
                                    <div><p className="text-gray-500 text-xs">Rate</p><p className="font-semibold">₹{salary.perDaySalary}</p></div>
                                    <div><p className="text-gray-500 text-xs">Bonus</p><p className="font-semibold text-emerald-600">+₹{salary.bonus}</p></div>
                                    <div><p className="text-gray-500 text-xs">Deductions</p><p className="font-semibold text-rose-600">-₹{salary.deductions}</p></div>
                                </div>
                                <div className="pt-2 space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Total Salary</span><span className="font-bold text-gray-900">₹{salary.totalSalary}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Paid Amount</span><span className="font-bold text-emerald-600">₹{salary.paidAmount}</span></div>
                                    <div className="flex justify-between text-lg border-t pt-2 mt-2 font-bold"><span className="text-gray-800">Remaining Due</span><span className="text-rose-600">₹{salary.remainingAmount}</span></div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <Button onClick={() => handleDownloadSlip(salary)} variant="secondary" size="sm" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 flex items-center justify-center">
                                        <FileText size={16} className="mr-2" /> Download Payslip
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center pt-4">
                            <span className="text-sm text-gray-500">Showing {paginatedSalaries.length} of {filteredSalaries.length} results</span>
                            <div className="flex gap-1">
                                <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 shadow-sm mr-2">Prev</Button>
                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                        return <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>{page}</button>;
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return <span key={page} className="px-1 text-gray-400">...</span>;
                                    }
                                    return null;
                                })}
                                <Button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 shadow-sm ml-2">Next</Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Admin View - Table */}
            {isAdmin && (
                <Card className="overflow-hidden shadow-sm border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                    <th className="p-4 whitespace-nowrap">Month</th>
                                    <th className="p-4 whitespace-nowrap">Staff Name</th>
                                    <th className="p-4 whitespace-nowrap">Present</th>
                                    <th className="p-4 whitespace-nowrap">Total</th>
                                    <th className="p-4 whitespace-nowrap">Paid</th>
                                    <th className="p-4 whitespace-nowrap">Remaining</th>
                                    <th className="p-4 whitespace-nowrap">Status</th>
                                    <th className="p-4 text-right whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {loading ? <tr><td colSpan={8} className="p-12 text-center"><Spinner /></td></tr> :
                                    paginatedSalaries.length === 0 ? <tr><td colSpan={8} className="p-12 text-center text-gray-500 font-medium">No salaries found.</td></tr> :
                                        paginatedSalaries.map(salary => (
                                            <tr key={salary.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="p-4 font-medium text-gray-900">{salary.month}/{salary.year}</td>
                                                <td className="p-4 font-medium">{salary.userName}</td>
                                                <td className="p-4 text-emerald-600 font-semibold">{salary.presentDays} / {salary.totalWorkingDays}</td>
                                                <td className="p-4 font-semibold text-gray-900">₹{salary.totalSalary}</td>
                                                <td className="p-4 text-emerald-600">₹{salary.paidAmount}</td>
                                                <td className="p-4 text-rose-600 font-bold">₹{salary.remainingAmount}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${salary.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : salary.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {salary.status === 'Paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {salary.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <Button onClick={() => handleDownloadSlip(salary)} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 shadow-sm" title="Download Slip">
                                                        <FileText size={16} />
                                                    </Button>
                                                    <div className="w-24">
                                                        {salary.status !== 'Paid' ? (
                                                            <Button onClick={() => setPayModal({ open: true, salaryId: salary.id, remaining: salary.remainingAmount, amount: salary.remainingAmount, method: 'Bank Transfer', transactionId: '' })} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                                                Pay
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs font-medium text-gray-400 block px-3 py-1.5 bg-gray-50 rounded-lg text-center">Settled</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                            </tbody>
                        </table>

                        {/* Admin Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm shrink-0">
                                <span className="text-gray-500">
                                    Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredSalaries.length)}</span> of <span className="font-medium text-gray-900">{filteredSalaries.length}</span> results
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 mr-2">Prev</Button>
                                    {[...Array(totalPages)].map((_, i) => {
                                        const page = i + 1;
                                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                            return <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>{page}</button>;
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return <span key={page} className="px-1 text-gray-400">...</span>;
                                        }
                                        return null;
                                    })}
                                    <Button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 ml-2">Next</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Generate Salary Modal (Admin) */}
            {isGenerateOpen && isAdmin && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm bg-white shadow-2xl p-6 border-0">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Salaries</h2>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="block text-sm font-semibold mb-1">Month</label><input type="number" min="1" max="12" value={genData.month} onChange={(e) => setGenData({ ...genData, month: e.target.value })} className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" required /></div>
                                <div className="flex-1"><label className="block text-sm font-semibold mb-1">Year</label><input type="number" value={genData.year} onChange={(e) => setGenData({ ...genData, year: e.target.value })} className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" required /></div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Per Day Salary (₹)</label>
                                <input type="number" min="1" value={genData.perDaySalary} onChange={(e) => setGenData({ ...genData, perDaySalary: e.target.value })} className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="block text-sm font-semibold mb-1">Bonus (₹)</label><input type="number" min="0" value={genData.bonus} onChange={(e) => setGenData({ ...genData, bonus: e.target.value })} className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-500" /></div>
                                <div className="flex-1"><label className="block text-sm font-semibold mb-1">Deductions (₹)</label><input type="number" min="0" value={genData.deductions} onChange={(e) => setGenData({ ...genData, deductions: e.target.value })} className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-rose-500" /></div>
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={generating} className="bg-blue-600 hover:bg-blue-700">{generating ? <Spinner size="sm" /> : 'Generate'}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Pay Modal */}
            {payModal.open && isAdmin && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm bg-white shadow-2xl p-6 border-0">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Disburse Salary</h2>
                        <form onSubmit={handlePay} className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between">
                                <span className="text-sm font-semibold text-blue-800">Remaining Due</span>
                                <span className="font-bold text-blue-900">₹{payModal.remaining}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Paying Amount</label>
                                <input type="number" step="0.01" max={payModal.remaining} required value={payModal.amount} onChange={(e) => setPayModal({ ...payModal, amount: e.target.value })} className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Payment Method</label>
                                <select value={payModal.method} onChange={(e) => setPayModal({ ...payModal, method: e.target.value, transactionId: '' })} className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500">
                                    <option>Bank Transfer</option><option>Cash</option><option>UPI</option>
                                </select>
                            </div>
                            {payModal.method !== 'Cash' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Transaction ID</label>
                                    <input type="text" required value={payModal.transactionId} onChange={(e) => setPayModal({ ...payModal, transactionId: e.target.value })} className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" placeholder="e.g. TXN123456789" />
                                </div>
                            )}
                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={() => setPayModal({ ...payModal, open: false })}>Cancel</Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirm Payment</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Salary;