import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import paymentService from '../../services/paymentService';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { Search, Banknote, ReceiptText, CheckCircle2, Clock, CalendarDays, Download, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { format, getDaysInMonth } from 'date-fns';

const Payments = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Admin form
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [genData, setGenData] = useState({
        fromDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        userType: 'All',
        userId: ''
    });
    const [generating, setGenerating] = useState(false);

    const [filters, setFilters] = useState({ fromDate: '', toDate: '', status: '' });
    const [detailsModal, setDetailsModal] = useState({ open: false, payment: null });

    // Pay form
    const [payModal, setPayModal] = useState({
        open: false, paymentId: null, remaining: 0, amount: '',
        method: 'Cash', cardDetails: { number: '', name: '', expiry: '', cvv: '' },
        upiId: 'meet1876patel@okhdfcbank', processing: false, receiptImage: null
    });

    // Breakdown
    const [breakdown, setBreakdown] = useState(null);

    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const fetchPayments = async () => {
        try {
            setLoading(true);
            let endpoint = isAdmin ? '/payment' : '/payment/my';
            if (isAdmin) {
                const params = new URLSearchParams();
                if (filters.fromDate) params.append('fromDate', filters.fromDate);
                if (filters.toDate) params.append('toDate', filters.toDate);
                if (filters.status) params.append('status', filters.status);
                const query = params.toString();
                if (query) endpoint += `?${query}`;
            }

            const res = await axiosClient.get(endpoint);
            const data = res.data;
            setPayments(data);
            setCurrentPage(1);

            if (!isAdmin && data.length > 0) {
                calculateBreakdown(data[0]); // breakdown for latest payment
            }
        } catch (error) {
            toast.error('Failed to load payments.');
        } finally {
            setLoading(false);
        }
    };

    const calculateBreakdown = async (latestPayment) => {
        setBreakdown({
            bCount: latestPayment.breakfastCount || 0,
            lCount: latestPayment.lunchCount || 0,
            dCount: latestPayment.dinnerCount || 0,
        });
    };

    useEffect(() => {
        fetchPayments();
    }, [isAdmin, filters.fromDate, filters.toDate, filters.status]);

    const handleGenerate = async (e) => {
        e.preventDefault();

        if (genData.userType === 'ParticularStudent' && (!genData.userId || genData.userId <= 0)) {
            toast.error("Please enter a valid Student User ID.");
            return;
        }

        // Frontend check to prevent duplicate bill generation for a specific student
        if (genData.userType === 'ParticularStudent') {
            const studentId = parseInt(genData.userId, 10);
            const fromDate = new Date(genData.fromDate);
            const toDate = new Date(genData.toDate);

            const billExists = payments.some(p => {
                if (p.userId !== studentId) return false;

                const pFrom = p.fromDate ? new Date(p.fromDate) : null;
                const pTo = p.toDate ? new Date(p.toDate) : null;

                if (!pFrom || !pTo) return false; // Only check range-based bills for overlap

                // Check for any overlap between the new range and an existing bill's range
                return fromDate <= pTo && toDate >= pFrom;
            });

            if (billExists) {
                toast.error('A bill for this student already exists within the selected date range.');
                return;
            }
        }

        try {
            setGenerating(true);
            const payload = { ...genData };
            if (payload.userType === 'ParticularStudent') {
                payload.userId = parseInt(payload.userId, 10);
            } else {
                delete payload.userId;
            }

            await axiosClient.post('/payment/generate-range', payload);
            toast.success('Bills generated successfully.');
            setIsGenerateOpen(false);
            fetchPayments();
        } catch (error) {
            if (error.response && error.response.status === 409) {
                // Handle conflict error from backend (e.g., bill already exists)
                toast.error(error.response.data || 'Bill already generated for this period.');
            } else {
                toast.error(error.response?.data || 'Failed to generate bills.');
            }
        } finally {
            setGenerating(false);
        }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        try {
            setPayModal(prev => ({ ...prev, processing: true }));

            let tranId = null;
            if (payModal.method === 'Card' || payModal.method === 'UPI') {
                if (!payModal.receiptImage) {
                    toast.error("Please upload payment receipt/proof before confirming.");
                    setPayModal(prev => ({ ...prev, processing: false }));
                    return;
                }
            }

            if (payModal.method === 'Card') {
                if (!payModal.cardDetails.number || !payModal.cardDetails.name || !payModal.cardDetails.expiry || !payModal.cardDetails.cvv) {
                    toast.error("Please fill all card details.");
                    setPayModal(prev => ({ ...prev, processing: false }));
                    return;
                }
                tranId = `CARD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            } else if (payModal.method === 'UPI') {
                tranId = `UPI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            }

            const formData = new FormData();
            formData.append('amount', payModal.amount);
            formData.append('paymentMethod', payModal.method);
            if (tranId) formData.append('transactionId', tranId);
            if (payModal.receiptImage) formData.append('receiptImage', payModal.receiptImage);

            await axiosClient.post(`/payment/pay/${payModal.paymentId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`${payModal.method} Payment processed successfully!`);
            setPayModal({
                open: false, paymentId: null, remaining: 0, amount: '',
                method: 'Cash', cardDetails: { number: '', name: '', expiry: '', cvv: '' },
                upiId: 'meet1876patel@okhdfcbank', processing: false, receiptImage: null
            });
            fetchPayments();
        } catch (error) {
            toast.error(error.response?.data || 'Payment processing failed.');
            setPayModal(prev => ({ ...prev, processing: false }));
        }
    };

    const handleExportExcel = () => {
        if (sortedPayments.length === 0) {
            toast.info("No data to export");
            return;
        }

        const headers = ['Period', 'Student', 'Total Amount', 'Paid Amount', 'Remaining Amount', 'Status', 'Breakfasts', 'Lunches', 'Dinners'];
        const csvRows = [headers.join(',')];

        sortedPayments.forEach(p => {
            const period = p.fromDate
                ? `${format(new Date(p.fromDate), 'yyyy-MM-dd')} to ${format(new Date(p.toDate), 'yyyy-MM-dd')}`
                : `${p.month}/${p.year}`;

            const row = [
                `"${period}"`,
                `"${p.userName || ''}"`,
                p.totalAmount,
                p.paidAmount,
                p.remainingAmount,
                p.status,
                p.breakfastCount || 0,
                p.lunchCount || 0,
                p.dinnerCount || 0
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `payments_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintInvoice = (payment) => {
        if (!payment) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice - ${payment.userName || 'Bill'}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                        .container { max-width: 800px; margin: auto; }
                        .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { margin: 0; color: #047857; font-size: 28px; }
                        .header p { margin: 5px 0 0; color: #64748b; }
                        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                        .details-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
                        .details-box h4 { margin: 0 0 5px; font-size: 12px; color: #475569; text-transform: uppercase; }
                        .details-box p { margin: 0; font-size: 16px; font-weight: 600; }
                        .breakdown-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
                        .breakdown-table th, .breakdown-table td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                        .breakdown-table thead th { background-color: #f1f5f9; color: #475569; font-weight: 600; }
                        .breakdown-table tbody tr:last-child td { border-bottom: none; }
                        .text-right { text-align: right; }
                        .totals-section { float: right; width: 40%; margin-top: 20px; }
                        .totals-table { width: 100%; }
                        .totals-table td { padding: 8px 0; }
                        .totals-table .label { color: #64748b; }
                        .totals-table .amount { font-weight: 600; text-align: right; }
                        .totals-table .final-due .label, .totals-table .final-due .amount { font-size: 18px; font-weight: bold; padding-top: 10px; border-top: 2px solid #e2e8f0; }
                        .totals-table .final-due .amount { color: #e11d48; }
                        .footer { margin-top: 100px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; clear: both; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Mess Management System</h1>
                            <p>Invoice for ${payment.fromDate ? format(new Date(payment.fromDate), 'MMMM yyyy') : `${payment.month}/${payment.year}`}</p>
                        </div>

                        <div class="details-grid">
                            <div class="details-box"><h4>Billed To</h4><p>${payment.userName || 'User'}</p></div>
                            <div class="details-box"><h4>Billing Period</h4><p>${payment.fromDate ? `${format(new Date(payment.fromDate), 'MMM dd, yyyy')} - ${format(new Date(payment.toDate), 'MMM dd, yyyy')}` : `Month of ${payment.month}/${payment.year}`}</p></div>
                            <div class="details-box"><h4>Invoice Status</h4><p style="color: ${payment.status === 'Paid' ? '#059669' : (payment.status === 'Partial' ? '#d97706' : '#e11d48')}">${payment.status}</p></div>
                            <div class="details-box"><h4>Generated On</h4><p>${format(new Date(), 'MMM dd, yyyy')}</p></div>
                        </div>
                        
                        <h3>Meal Breakdown</h3>
                        <table class="breakdown-table">
                            <thead><tr><th>Item</th><th>Count</th><th>Rate</th><th class="text-right">Subtotal</th></tr></thead>
                            <tbody>
                                <tr><td>Breakfast</td><td>${payment.breakfastCount || 0}</td><td>₹30</td><td class="text-right">₹${(payment.breakfastCount || 0) * 30}</td></tr>
                                <tr><td>Lunch</td><td>${payment.lunchCount || 0}</td><td>₹60</td><td class="text-right">₹${(payment.lunchCount || 0) * 60}</td></tr>
                                <tr><td>Dinner</td><td>${payment.dinnerCount || 0}</td><td>₹50</td><td class="text-right">₹${(payment.dinnerCount || 0) * 50}</td></tr>
                            </tbody>
                        </table>

                        <div class="totals-section"><table class="totals-table"><tbody>
                            <tr><td class="label">Total Amount</td><td class="amount">₹${payment.totalAmount}</td></tr>
                            <tr><td class="label">Amount Paid</td><td class="amount" style="color: #059669;">₹${payment.paidAmount}</td></tr>
                            <tr class="final-due"><td class="label">Remaining Due</td><td class="amount">₹${payment.remainingAmount}</td></tr>
                        </tbody></table></div>

                        <div class="footer">This is a system-generated invoice and does not require a physical signature.</div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search, sortConfig, filters]);

    const filteredPayments = payments.filter(p => {
        if (!search) return true;
        const term = search.toLowerCase();
        if (isAdmin) {
            return p.userName && p.userName.toLowerCase().includes(term);
        }
        return (p.status && p.status.toLowerCase().includes(term)) ||
            (p.month && p.month.toString().includes(term)) ||
            (p.year && p.year.toString().includes(term));
    });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedPayments = [...filteredPayments].sort((a, b) => {
        if (sortConfig.key === 'amount') {
            return sortConfig.direction === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        } else if (sortConfig.key === 'date') {
            const dateA = a.fromDate ? new Date(a.fromDate).getTime() : new Date(a.year, a.month - 1).getTime();
            const dateB = b.fromDate ? new Date(b.fromDate).getTime() : new Date(b.year, b.month - 1).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return 0;
    });

    const totalPages = Math.ceil(sortedPayments.length / itemsPerPage);
    const paginatedPayments = sortedPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in p-2 sm:p-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payments & Dues</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isAdmin ? "Manage student invoices and generate bills for date ranges." : "View your billing history and settle outstanding dues."}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={isAdmin ? "Search by user name..." : "Search..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    {isAdmin && (
                        <>
                            <input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                                className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                                className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">All Status</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                            </select>
                            <Button onClick={() => setIsGenerateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 whitespace-nowrap shadow-md hover:shadow-lg transition-all">
                                <CalendarDays size={18} className="mr-2" />
                                Generate Bills
                            </Button>
                            <Button onClick={handleExportExcel} variant="secondary" className="whitespace-nowrap shadow-md hover:shadow-lg transition-all bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
                                <Download size={18} className="mr-2 text-gray-500" />
                                Export Excel
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Side: Summary or Admin Tools */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg transform transition-transform hover:scale-105">
                        <div className="flex items-center gap-3 mb-4 text-indigo-100">
                            <Banknote size={24} />
                            <h3 className="font-semibold uppercase tracking-wider text-sm">Overview</h3>
                        </div>
                        {isAdmin ? (
                            <div>
                                <p className="text-indigo-100 text-sm mb-1">Total Unpaid Bills</p>
                                <h2 className="text-4xl font-bold mb-4">{payments.filter(p => p.status === 'Pending' || p.status === 'Partial').length}</h2>
                            </div>
                        ) : (
                            <div>
                                <p className="text-indigo-100 text-sm mb-1">Total Outstanding (₹)</p>
                                <h2 className="text-4xl font-bold mb-4">
                                    ₹{payments.filter(p => ['Pending', 'Partial'].includes(p.status)).reduce((acc, p) => acc + p.remainingAmount, 0)}
                                </h2>
                            </div>
                        )}
                        <div className="pt-4 border-t border-indigo-400/30">
                            <p className="text-sm font-medium">{isAdmin ? "Keep track of pending accounts." : "Keep your account in good standing."}</p>
                        </div>
                    </Card>

                    {/* Breakdown section for students */}
                    {!isAdmin && breakdown && payments.length > 0 && (
                        <Card className="p-5 border border-indigo-100 shadow-sm top-0 sticky">
                            <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2"><ReceiptText size={18} className="text-indigo-500" /> Latest Meal Breakdown</h3>
                            <div className="text-sm text-gray-600 mb-4 bg-indigo-50 p-3 rounded-lg">
                                Period: {payments[0].fromDate ? `${format(new Date(payments[0].fromDate), 'MMM dd')} - ${format(new Date(payments[0].toDate), 'MMM dd, yyyy')}` : `${payments[0].month}/${payments[0].year}`}
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-t-lg">
                                    <tr>
                                        <th className="px-2 py-2 rounded-tl-lg">Meal</th>
                                        <th className="px-2 py-2">Count</th>
                                        <th className="px-2 py-2 text-right rounded-tr-lg">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="px-2 py-2 font-medium">B.Fast</td>
                                        <td className="px-2 py-2">{breakdown.bCount} x ₹30</td>
                                        <td className="px-2 py-2 text-right text-indigo-600 font-medium">₹{breakdown.bCount * 30}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-2 py-2 font-medium">Lunch</td>
                                        <td className="px-2 py-2">{breakdown.lCount} x ₹60</td>
                                        <td className="px-2 py-2 text-right text-indigo-600 font-medium">₹{breakdown.lCount * 60}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-2 py-2 font-medium">Dinner</td>
                                        <td className="px-2 py-2">{breakdown.dCount} x ₹50</td>
                                        <td className="px-2 py-2 text-right text-indigo-600 font-medium">₹{breakdown.dCount * 50}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold text-gray-900 bg-gray-50 rounded-b-lg">
                                        <td className="px-2 py-3 rounded-bl-lg" colSpan="2">Generated Total</td>
                                        <td className="px-2 py-3 text-right rounded-br-lg text-lg text-emerald-600">₹{payments[0].totalAmount}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </Card>
                    )}
                </div>

                {/* Right Side: Data Table */}
                <Card className="lg:col-span-3 overflow-hidden flex flex-col min-h-[400px] shadow-sm border border-gray-100">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center"><Spinner /></div>
                    ) : (
                        <>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                            <th className="p-4 rounded-tl-xl whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('date')}>
                                                Period {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                            </th>
                                            {isAdmin && <th className="p-4 whitespace-nowrap">Student</th>}
                                            <th className="p-4 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('amount')}>
                                                Total {sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                            </th>
                                            <th className="p-4 whitespace-nowrap">Paid</th>
                                            <th className="p-4 whitespace-nowrap">Remaining</th>
                                            <th className="p-4 whitespace-nowrap">Status</th>
                                            <th className="p-4 text-right rounded-tr-xl whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                        {paginatedPayments.length === 0 ? (
                                            <tr>
                                                <td colSpan={isAdmin ? 7 : 6} className="p-16 text-center">
                                                    <ReceiptText size={48} className="mx-auto text-gray-200 mb-4" />
                                                    <p className="text-gray-500 font-medium text-lg">No payment records found.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedPayments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                                                        {payment.fromDate ? `${format(new Date(payment.fromDate), 'MMM dd')} - ${format(new Date(payment.toDate), 'MMM dd')}` : `${payment.month}/${payment.year}`}
                                                    </td>
                                                    {isAdmin && <td className="p-4 text-gray-600">{payment.userName}</td>}
                                                    <td className="p-4 font-semibold text-gray-900">₹{payment.totalAmount}</td>
                                                    <td className="p-4 text-emerald-600 font-medium text-xs bg-emerald-50/50 rounded-lg">₹{payment.paidAmount}</td>
                                                    <td className="p-4 text-rose-600 font-semibold bg-rose-50/50 rounded-lg">₹{payment.remainingAmount}</td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                            payment.status === 'Partial' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                                'bg-rose-100 text-rose-700 border border-rose-200'
                                                            }`}>
                                                            {payment.status === 'Paid' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                                        <Button onClick={() => setDetailsModal({ open: true, payment })} size="sm" variant="secondary" className="py-1.5 px-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm">
                                                            Details
                                                        </Button>
                                                        {!isAdmin && (payment.status === 'Pending' || payment.status === 'Partial') ? (
                                                            <Button
                                                                onClick={() => setPayModal({ open: true, paymentId: payment.id, remaining: payment.remainingAmount, amount: payment.remainingAmount, method: 'Cash', cardDetails: { number: '', name: '', expiry: '', cvv: '' }, upiId: 'meet1876patel@okhdfcbank', processing: false, receiptImage: null })}
                                                                size="sm"
                                                                className="py-1.5 px-4 bg-indigo-600 text-white hover:bg-indigo-700 border-0 shadow hover:shadow-md transition-all rounded-lg opacity-90 group-hover:opacity-100"
                                                            >
                                                                Pay
                                                            </Button>
                                                        ) : payment.status === 'Paid' ? (
                                                            <span className="text-xs font-medium text-gray-400 inline-block px-3 py-1.5 bg-gray-50 rounded-lg">
                                                                {payment.datePaid && format(new Date(payment.datePaid), 'MMM dd')}
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm shrink-0">
                                    <span className="text-gray-500">
                                        Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, sortedPayments.length)}</span> of <span className="font-medium text-gray-900">{sortedPayments.length}</span> results
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 mr-2">
                                            Prev
                                        </Button>

                                        {[...Array(totalPages)].map((_, i) => {
                                            const page = i + 1;
                                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                return (
                                                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>
                                                        {page}
                                                    </button>
                                                );
                                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                return <span key={page} className="px-1 text-gray-400">...</span>;
                                            }
                                            return null;
                                        })}

                                        <Button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 ml-2">
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>

            {/* Generate Bills Modal (Admin) */}
            {isGenerateOpen && isAdmin && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm bg-white shadow-2xl animate-fade-in border-0">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><CalendarDays size={20} className="text-indigo-600" /> Generate Bills</h2>
                            <button onClick={() => setIsGenerateOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
                        </div>
                        <form onSubmit={handleGenerate} className="p-6 space-y-5">
                            <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-800 shadow-inner">
                                This will generate bills for all students for the selected month by meticulously compiling their registered attendance logs (Breakfast=30, Lunch=60, Dinner=50).
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">From Date</label>
                                    <input
                                        type="date" required
                                        value={genData.fromDate}
                                        onChange={(e) => setGenData({ ...genData, fromDate: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 transition-all font-medium"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">To Date</label>
                                    <input
                                        type="date" required
                                        value={genData.toDate}
                                        onChange={(e) => setGenData({ ...genData, toDate: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">User Type</label>
                                <select
                                    value={genData.userType}
                                    onChange={(e) => setGenData({ ...genData, userType: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 transition-all font-medium"
                                >
                                    <option value="All">All Users</option>
                                    <option value="Student">Students Only</option>
                                    <option value="ParticularStudent">Particular Student</option>
                                </select>
                            </div>
                            {genData.userType === 'ParticularStudent' && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student User ID</label>
                                    <input
                                        type="number"
                                        required
                                        value={genData.userId}
                                        onChange={(e) => setGenData({ ...genData, userId: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 transition-all font-medium"
                                        placeholder="e.g. 2"
                                    />
                                </div>
                            )}
                            <div className="pt-2">
                                <Button type="submit" disabled={generating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 shadow-md hover:shadow-lg transition-all rounded-xl">
                                    {generating ? <Spinner size="sm" /> : 'Calculate & Generate'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Bill Details Modal */}
            {detailsModal.open && detailsModal.payment && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white shadow-2xl animate-fade-in border-0 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ReceiptText size={20} className="text-indigo-600" /> Invoice Details</h2>
                            <button type="button" onClick={() => setDetailsModal({ open: false, payment: null })} className="text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Billed To</p>
                                    <p className="font-bold text-gray-900 text-lg">{detailsModal.payment.userName || 'You'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold mt-1 ${detailsModal.payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                        detailsModal.payment.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                                            'bg-rose-100 text-rose-700'
                                        }`}>
                                        {detailsModal.payment.status}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                                <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">Billing Period</p>
                                <p className="font-medium text-indigo-900">
                                    {detailsModal.payment.fromDate ? format(new Date(detailsModal.payment.fromDate), 'MMM dd, yyyy') : `01/${detailsModal.payment.month}/${detailsModal.payment.year}`}
                                    {' - '}
                                    {detailsModal.payment.toDate ? format(new Date(detailsModal.payment.toDate), 'MMM dd, yyyy') : `30/${detailsModal.payment.month}/${detailsModal.payment.year}`}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Meal Breakdown</p>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                                        <span className="font-medium">Breakfast</span>
                                        <span>{detailsModal.payment.breakfastCount} <span className="text-gray-400 text-xs mx-1">x ₹30</span> <span className="font-semibold text-gray-900">₹{detailsModal.payment.breakfastCount * 30}</span></span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                                        <span className="font-medium">Lunch</span>
                                        <span>{detailsModal.payment.lunchCount} <span className="text-gray-400 text-xs mx-1">x ₹60</span> <span className="font-semibold text-gray-900">₹{detailsModal.payment.lunchCount * 60}</span></span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                                        <span className="font-medium">Dinner</span>
                                        <span>{detailsModal.payment.dinnerCount} <span className="text-gray-400 text-xs mx-1">x ₹50</span> <span className="font-semibold text-gray-900">₹{detailsModal.payment.dinnerCount * 50}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Total Amount</span>
                                    <span className="font-semibold text-gray-900">₹{detailsModal.payment.totalAmount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Paid Amount</span>
                                    <span className="font-semibold text-emerald-600">₹{detailsModal.payment.paidAmount}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-50">
                                    <span className="text-gray-800">Remaining Due</span>
                                    <span className="text-rose-600">₹{detailsModal.payment.remainingAmount}</span>
                                </div>
                            </div>
                            {isAdmin && detailsModal.payment.receiptImageUrl && (
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Payment Receipt Proof</p>
                                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex justify-center p-2">
                                        <img src={`http://localhost:5130${detailsModal.payment.receiptImageUrl}`} alt="Payment Receipt" className="max-w-full h-auto max-h-64 object-contain rounded-lg" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                            <Button onClick={() => handlePrintInvoice(detailsModal.payment)} variant="secondary" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm flex items-center">
                                <Printer size={16} className="mr-2" />
                                Print / Download
                            </Button>
                            <Button onClick={() => setDetailsModal({ open: false, payment: null })} className="bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-sm">Close</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Pay Modal */}
            {payModal.open && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white shadow-2xl animate-fade-in border-0 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-emerald-50 shrink-0">
                            <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2"><Banknote size={20} className="text-emerald-600" /> Secure Payment</h2>
                            <button type="button" onClick={() => setPayModal({ ...payModal, open: false })} className="text-emerald-400 hover:text-emerald-600 transition-colors">&times;</button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6">
                            <form onSubmit={handlePay} className="space-y-6">

                                {/* Summary */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-600">Total Dues</span>
                                    <span className="text-lg font-bold text-gray-900">₹{payModal.remaining}</span>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Paying Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                        <input
                                            type="number" required step="0.01" max={payModal.remaining} min="1"
                                            value={payModal.amount}
                                            onChange={(e) => setPayModal({ ...payModal, amount: e.target.value })}
                                            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg font-semibold bg-white shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Payment Method Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Select Payment Method</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Cash', 'Card', 'UPI'].map(method => (
                                            <div
                                                key={method}
                                                onClick={() => setPayModal({ ...payModal, method })}
                                                className={`cursor-pointer border-2 rounded-xl text-center py-3 px-2 font-semibold text-sm transition-all ${payModal.method === method ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-emerald-200 hover:bg-gray-50'}`}
                                            >
                                                {method}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dynamic Sections */}
                                <div className="min-h-[160px] flex flex-col justify-center">
                                    {payModal.method === 'Cash' && (
                                        <div className="text-center p-6 bg-amber-50 rounded-xl border border-amber-100">
                                            <p className="text-sm text-amber-800 font-medium">Please hand over the exact cash amount to the mess admin or staff present.</p>
                                        </div>
                                    )}

                                    {payModal.method === 'Card' && (
                                        <div className="space-y-4 animate-fade-in p-1">
                                            <div>
                                                <input type="text" placeholder="Card Number"
                                                    value={payModal.cardDetails.number} onChange={e => setPayModal({ ...payModal, cardDetails: { ...payModal.cardDetails, number: e.target.value } })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                                                />
                                            </div>
                                            <div>
                                                <input type="text" placeholder="Card Holder Name"
                                                    value={payModal.cardDetails.name} onChange={e => setPayModal({ ...payModal, cardDetails: { ...payModal.cardDetails, name: e.target.value } })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <input type="text" placeholder="MM/YY"
                                                    value={payModal.cardDetails.expiry} onChange={e => setPayModal({ ...payModal, cardDetails: { ...payModal.cardDetails, expiry: e.target.value } })}
                                                    className="w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                                                />
                                                <input type="text" placeholder="CVV"
                                                    value={payModal.cardDetails.cvv} onChange={e => setPayModal({ ...payModal, cardDetails: { ...payModal.cardDetails, cvv: e.target.value } })}
                                                    className="w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {payModal.method === 'UPI' && (
                                        <div className="text-center animate-fade-in p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="w-32 h-32 mx-auto bg-white mb-3 p-2 shadow-sm rounded-xl">
                                                <img src="/QR.jpeg" alt="UPI QR" className="w-full h-full object-contain" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-500 mb-1">Scan to Pay</p>
                                            <p className="text-sm font-semibold text-gray-800 tracking-wide">{payModal.upiId}</p>
                                        </div>
                                    )}
                                </div>

                                {(payModal.method === 'Card' || payModal.method === 'UPI') && (
                                    <div className="mt-4 animate-fade-in">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Receipt Proof <span className="text-rose-500">*</span></label>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            required
                                            onChange={(e) => setPayModal({ ...payModal, receiptImage: e.target.files[0] })}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 p-2 border border-gray-200 rounded-xl bg-white"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Please upload a screenshot or photo of your payment success message.</p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100">
                                    <Button type="submit" disabled={payModal.processing || ((payModal.method === 'UPI' || payModal.method === 'Card') && !payModal.receiptImage)} className="w-full flex justify-center items-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-xl font-bold py-3 text-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                                        {payModal.processing ? <Spinner size="sm" /> : payModal.method === 'UPI' ? 'I Have Paid' : 'Confirm Payment'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Payments;
