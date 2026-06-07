import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { Clock, Plus, Check, X, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const OvertimeManagement = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Add Overtime Modal
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        overtimeHours: '',
        overtimeDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/overtime');
            setRecords(res.data);
        } catch (error) {
            toast.error('Failed to load overtime records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await axiosClient.post('/overtime', {
                overtimeHours: parseFloat(formData.overtimeHours),
                overtimeDate: new Date(formData.overtimeDate)
            });
            toast.success('Overtime hours submitted successfully.');
            setIsOpen(false);
            setFormData({ overtimeHours: '', overtimeDate: format(new Date(), 'yyyy-MM-dd') });
            fetchRecords();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to submit overtime hours.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id, status) => {
        try {
            await axiosClient.put(`/overtime/approve/${id}`, { status });
            toast.success(`Overtime record has been ${status.toLowerCase()}!`);
            fetchRecords();
        } catch (error) {
            toast.error('Failed to update overtime record approval status.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <Clock className="text-orange-500" />
                        Overtime Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isAdmin ? "Review, approve, or reject logged overtime records." : "Log and submit your extra overtime hours."}
                    </p>
                </div>
                {!isAdmin && (
                    <Button onClick={() => setIsOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md border-0 flex items-center gap-1.5 hover:shadow-lg transition-all">
                        <Plus size={16} /> Log Overtime
                    </Button>
                )}
            </div>

            {/* List */}
            <Card className="overflow-hidden shadow-sm border border-gray-100 rounded-3xl">
                {loading ? (
                    <div className="py-16 flex justify-center"><Spinner /></div>
                ) : records.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 font-medium">No overtime logs found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="p-4">Staff Name</th>
                                    <th className="p-4">Overtime Date</th>
                                    <th className="p-4">Logged Hours</th>
                                    <th className="p-4">Hourly Rate</th>
                                    <th className="p-4">Cost (Total)</th>
                                    <th className="p-4">Approved By</th>
                                    <th className="p-4">Status</th>
                                    {isAdmin && <th className="p-4 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700 bg-white">
                                {records.map(item => (
                                    <tr key={item.overtimeId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-bold text-gray-900">{item.staffName}</td>
                                        <td className="p-4 font-semibold text-gray-500">{format(new Date(item.overtimeDate), 'dd MMM yyyy')}</td>
                                        <td className="p-4 font-mono font-bold text-orange-600">{item.overtimeHours} Hrs</td>
                                        <td className="p-4 font-mono font-semibold">₹{item.overtimeRate}</td>
                                        <td className="p-4 font-mono font-black text-gray-900">₹{(item.overtimeHours * item.overtimeRate).toFixed(2)}</td>
                                        <td className="p-4 text-xs font-semibold text-gray-400">{item.approvedBy || '-'}</td>
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
                                                        <Button onClick={() => handleApprove(item.overtimeId, 'Approved')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg shadow-sm border-0" title="Approve">
                                                            <Check size={14} />
                                                        </Button>
                                                        <Button onClick={() => handleApprove(item.overtimeId, 'Rejected')} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-sm border-0" title="Reject">
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

            {/* Log Overtime Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm bg-white shadow-2xl rounded-2xl p-6 border-0">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Log Overtime</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Overtime Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.overtimeDate}
                                    onChange={e => setFormData(prev => ({ ...prev, overtimeDate: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Overtime Hours</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    required
                                    placeholder="e.g. 2.5"
                                    value={formData.overtimeHours}
                                    onChange={e => setFormData(prev => ({ ...prev, overtimeHours: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm font-mono"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-5 py-2 rounded-xl shadow-md border-0">
                                    {submitting ? <Spinner size="sm" /> : 'Submit Hours'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default OvertimeManagement;
