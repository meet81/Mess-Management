import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { CalendarOff, Send, CheckCircle2, AlertCircle, Clock, Utensils } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Leave = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [leaveList, setLeaveList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Submit Form State
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        reason: '',
        breakfastLeave: true,
        lunchLeave: true,
        dinnerLeave: true
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const endpoint = isAdmin ? '/leave' : '/leave/my';
            const res = await axiosClient.get(endpoint);
            setLeaveList(res.data);
            setCurrentPage(1);
        } catch (error) {
            toast.error('Failed to load leave records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [isAdmin]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.startDate || !formData.endDate) return toast.warning("Please select start and end dates.");
        if (new Date(formData.endDate) < new Date(formData.startDate)) return toast.warning("End date cannot be before start date.");
        if (!formData.reason.trim()) return toast.warning("Please provide a reason for the leave.");
        if (!formData.breakfastLeave && !formData.lunchLeave && !formData.dinnerLeave) return toast.warning("Please select at least one meal to skip.");

        try {
            setSubmitting(true);
            await axiosClient.post('/leave', formData);
            toast.success("Leave request submitted successfully!");
            setFormData({
                startDate: '',
                endDate: '',
                reason: '',
                breakfastLeave: true,
                lunchLeave: true,
                dinnerLeave: true
            });
            fetchLeaves();
        } catch (error) {
            toast.error('Failed to submit leave request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await axiosClient.put(`/leave/${id}/status`, { status: newStatus });
            toast.success(`Leave marked as ${newStatus}.`);
            fetchLeaves();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to update leave status.');
        }
    };

    const totalPages = Math.ceil(leaveList.length / itemsPerPage);
    const paginatedLeaves = leaveList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 items-start flex flex-col lg:flex-row gap-8">

            {/* Left Column: Apply for Leave (Students & Staff) */}
            {!isAdmin && (
                <div className="w-full lg:w-1/3 flex-shrink-0 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Leave Application</h1>
                        <p className="text-gray-500 text-sm mt-1">Going home? Let us know so we can plan the meals accurately.</p>
                    </div>

                    <Card className="p-6 bg-white border-orange-100 shadow-sm border-t-4 border-t-orange-500">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CalendarOff size={20} className="text-orange-500" />
                            Apply for Leave
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-gray-50 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-gray-50 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Meals to Skip</label>
                                <div className="flex gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-orange-600 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.breakfastLeave}
                                            onChange={(e) => setFormData({ ...formData, breakfastLeave: e.target.checked })}
                                            className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                                        />
                                        <span>Breakfast</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-orange-600 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.lunchLeave}
                                            onChange={(e) => setFormData({ ...formData, lunchLeave: e.target.checked })}
                                            className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                                        />
                                        <span>Lunch</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-orange-600 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.dinnerLeave}
                                            onChange={(e) => setFormData({ ...formData, dinnerLeave: e.target.checked })}
                                            className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                                        />
                                        <span>Dinner</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none bg-gray-50 text-sm"
                                    placeholder="e.g. Going home for the weekend"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                            >
                                {submitting ? <Spinner size={18} className="text-white mx-auto" /> : (
                                    <>
                                        <Send size={18} className="mr-2" />
                                        Submit Leave Request
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* Right Column: Leave History & Approvals */}
            <div className={`w-full ${isAdmin ? 'lg:flex-none max-w-4xl mx-auto pt-4' : 'lg:flex-1 pt-1 lg:pt-14'} space-y-4`}>
                <div className="flex justify-between items-center mb-2">
                    <div>
                        {isAdmin && <h1 className="text-2xl font-bold text-gray-900 mb-2">Leave Management</h1>}
                        <h3 className="text-lg font-bold text-gray-900">
                            {isAdmin ? "All Leave Requests" : "Your Leave History"}
                        </h3>
                    </div>

                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold self-end md:self-center">
                        {leaveList.length} requests
                    </span>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center"><Spinner /></div>
                ) : leaveList.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 pt-8 mt-4">
                        <CalendarOff size={40} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No leaves found</h3>
                        <p className="text-gray-500 mt-1">
                            {isAdmin ? "No users have applied for leave recently." : "You haven't applied for any leaves yet."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {paginatedLeaves.map((leave) => {
                                const isPending = leave.status === 'Pending';
                                const isApproved = leave.status === 'Approved';
                                const isRejected = leave.status === 'Rejected';

                                return (
                                    <Card key={leave.leaveId} className={`p-5 flex flex-col gap-4 ${isPending ? 'bg-white border-blue-100 shadow-md' : 'bg-gray-50/50 opacity-90'}`}>

                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {format(new Date(leave.startDate), 'MMM dd, yyyy')}
                                                        <span className="text-gray-400 font-normal mx-2">to</span>
                                                        {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                                {isAdmin && (
                                                    <div className="text-xs font-medium text-gray-600">
                                                        Applied by: <span className="font-bold text-gray-900">{leave.userName}</span> ({leave.userRole})
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md mt-1 md:mt-0 ${isApproved ? 'text-green-700 bg-green-100' :
                                                    isRejected ? 'text-red-700 bg-red-100' :
                                                        'text-blue-700 bg-blue-100 border border-blue-200'
                                                    }`}>
                                                    {isApproved ? <CheckCircle2 size={14} /> :
                                                        isRejected ? <AlertCircle size={14} /> :
                                                            <Clock size={14} />}
                                                    {leave.status}
                                                </span>

                                            </div>
                                        </div>

                                        <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700 flex flex-col gap-2">
                                            <div><strong>Reason:</strong> {leave.reason}</div>
                                            <div className="flex items-center gap-2 text-xs font-medium mt-1">
                                                <Utensils size={14} className="text-gray-400" />
                                                <span className="text-gray-500">Meals Skipped:</span>
                                                <div className="flex gap-2">
                                                    {leave.breakfastLeave && <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-amber-600">Breakfast</span>}
                                                    {leave.lunchLeave && <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-orange-600">Lunch</span>}
                                                    {leave.dinnerLeave && <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-indigo-600">Dinner</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && isPending && (
                                            <div className="pt-2 border-t border-gray-100 flex gap-2">
                                                <Button
                                                    onClick={() => handleUpdateStatus(leave.leaveId, "Approved")}
                                                    size="sm"
                                                    className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500 py-1.5 text-xs"
                                                >
                                                    <CheckCircle2 size={16} className="mr-1.5" /> Approve
                                                </Button>
                                                <Button
                                                    onClick={() => handleUpdateStatus(leave.leaveId, "Rejected")}
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 py-1.5 text-xs focus:ring-red-500"
                                                >
                                                    <AlertCircle size={16} className="mr-1.5" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                                <span className="text-gray-500">
                                    Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, leaveList.length)}</span> of <span className="font-medium text-gray-900">{leaveList.length}</span> results
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 mr-2">
                                        Prev
                                    </Button>

                                    {[...Array(totalPages)].map((_, i) => {
                                        const page = i + 1;
                                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                            return (
                                                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-orange-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>
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
            </div>

        </div>
    );
};

export default Leave;
