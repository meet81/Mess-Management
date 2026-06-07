import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { Coins, Plus, Check, X, ShieldAlert, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const SalaryAdvanceManagement = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);

    // Request advance modal
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        advanceAmount: '',
        recoveryAmount: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchAdvances = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/salary-advance');
            setAdvances(res.data);
        } catch (error) {
            toast.error('Failed to load salary advance records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvances();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await axiosClient.post('/salary-advance', {
                advanceAmount: parseFloat(formData.advanceAmount),
                recoveryAmount: parseFloat(formData.recoveryAmount)
            });
            toast.success('Advance request submitted successfully.');
            setIsOpen(false);
            setFormData({ advanceAmount: '', recoveryAmount: '' });
            fetchAdvances();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to submit advance request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id, status) => {
        try {
            await axiosClient.put(`/salary-advance/approve/${id}`, { status });
            toast.success(`Advance request has been ${status.toLowerCase()}!`);
            fetchAdvances();
        } catch (error) {
            toast.error('Failed to update advance approval status.');
        }
    };

    const totalOutstanding = advances
        .Where ? advances : [] // Safety check
        .filter(a => a.approvalStatus === 'Approved')
        .reduce((sum, a) => sum + a.remainingAmount, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <Coins className="text-orange-500" />
                        Salary Advance Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isAdmin ? "Track advance disbursements, recoveries, and approve requests." : "Request salary advance and check outstanding balances."}
                    </p>
                </div>
                {!isAdmin && (
                    <Button onClick={() => setIsOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md border-0 flex items-center gap-1.5 hover:shadow-lg transition-all">
                        <Plus size={16} /> Request Advance
                    </Button>
                )}
            </div>

            {/* Total Balance Card */}
            {!isAdmin && !loading && totalOutstanding > 0 && (
                <Card className="p-4 bg-orange-50 border border-orange-100 flex items-center gap-4 text-orange-950">
                    <AlertCircle className="text-orange-500 shrink-0" size={24} />
                    <div>
                        <h4 className="font-bold text-sm">Outstanding Advance Balance: ₹{totalOutstanding.toFixed(2)}</h4>
                        <p className="text-xs text-orange-700/80 mt-0.5">This balance will be recovered automatically in monthly payroll runs.</p>
                    </div>
                </Card>
            )}

            {/* List */}
            <Card className="overflow-hidden shadow-sm border border-gray-100 rounded-3xl">
                {loading ? (
                    <div className="py-16 flex justify-center"><Spinner /></div>
                ) : advances.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 font-medium">No salary advance logs found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="p-4">Staff Name</th>
                                    <th className="p-4">Requested Date</th>
                                    <th className="p-4">Advance Amount</th>
                                    <th className="p-4">Monthly Recovery</th>
                                    <th className="p-4">Outstanding Balance</th>
                                    <th className="p-4">Status</th>
                                    {isAdmin && <th className="p-4 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700 bg-white">
                                {advances.map(item => (
                                    <tr key={item.advanceId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-bold text-gray-900">{item.staffName}</td>
                                        <td className="p-4 font-semibold text-gray-500">{format(new Date(item.createdAt), 'dd MMM yyyy')}</td>
                                        <td className="p-4 font-mono font-bold text-gray-900">₹{item.advanceAmount.toFixed(2)}</td>
                                        <td className="p-4 font-mono font-semibold text-orange-600">₹{item.recoveryAmount.toFixed(2)}</td>
                                        <td className="p-4 font-mono font-black text-rose-600">₹{item.remainingAmount.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase ${
                                                item.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                                item.approvalStatus === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                                {item.approvalStatus}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="p-4 text-right flex justify-end gap-1.5">
                                                {item.approvalStatus === 'Pending' ? (
                                                    <>
                                                        <Button onClick={() => handleApprove(item.advanceId, 'Approved')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg shadow-sm border-0" title="Approve">
                                                            <Check size={14} />
                                                        </Button>
                                                        <Button onClick={() => handleApprove(item.advanceId, 'Rejected')} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-sm border-0" title="Reject">
                                                            <X size={14} />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400 px-3 py-1 font-semibold select-none bg-gray-50 border border-gray-100 rounded-lg">Settled</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Request Advance Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm bg-white shadow-2xl rounded-2xl p-6 border-0">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Salary Advance</h2>
                        <p className="text-xs text-gray-400 mb-4">Request a lump-sum advance and specify your preferred recovery installments.</p>
                        
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Advance Amount (₹)</label>
                                <input
                                    type="number"
                                    min="100"
                                    required
                                    placeholder="e.g. 5000"
                                    value={formData.advanceAmount}
                                    onChange={e => setFormData(prev => ({ ...prev, advanceAmount: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Monthly Recovery Installment (₹)</label>
                                <input
                                    type="number"
                                    min="50"
                                    required
                                    placeholder="e.g. 1000"
                                    value={formData.recoveryAmount}
                                    onChange={e => setFormData(prev => ({ ...prev, recoveryAmount: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm font-mono"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-5 py-2 rounded-xl shadow-md border-0">
                                    {submitting ? <Spinner size="sm" /> : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SalaryAdvanceManagement;
