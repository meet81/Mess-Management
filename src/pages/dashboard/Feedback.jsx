import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { MessageSquare, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Feedback = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Submit Form State
    const [formData, setFormData] = useState({ category: 'Quality', message: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const endpoint = isAdmin ? '/feedback' : '/feedback/my';
            const res = await axiosClient.get(endpoint);
            setFeedbackList(res.data);
            setCurrentPage(1);
        } catch (error) {
            toast.error('Failed to load feedback records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, [isAdmin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.message.trim()) return toast.warning("Message cannot be empty.");

        try {
            setSubmitting(true);
            await axiosClient.post('/feedback', formData);
            toast.success("Feedback submitted successfully. Thank you!");
            setFormData({ ...formData, message: '' });
            fetchFeedback();
        } catch (error) {
            toast.error('Failed to submit feedback.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkReviewed = async (id) => {
        try {
            await axiosClient.put(`/feedback/${id}/review`);
            toast.success("Feedback marked as reviewed.");
            fetchFeedback();
        } catch (error) {
            toast.error('Failed to update status.');
        }
    };

    const categoryColors = {
        'Quality': 'bg-blue-100 text-blue-700',
        'Hygiene': 'bg-teal-100 text-teal-700',
        'Menu': 'bg-orange-100 text-orange-700',
        'Staff': 'bg-purple-100 text-purple-700',
        'Other': 'bg-gray-100 text-gray-700',
    };

    const totalPages = Math.ceil(feedbackList.length / itemsPerPage);
    const paginatedFeedback = feedbackList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 items-start flex flex-col lg:flex-row gap-8">

            {/* Left Column: Submit New Feedback (Non-Admin mostly, but anyone can technically) */}
            <div className="w-full lg:w-1/3 flex-shrink-0 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
                    <p className="text-gray-500 text-sm mt-1">Help us improve the mess experience.</p>
                </div>

                {!isAdmin && (
                    <Card className="p-6 bg-white border-purple-100 shadow-sm border-t-4 border-t-purple-500">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare size={20} className="text-purple-500" />
                            Write to us
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50"
                                >
                                    <option value="Quality">Food Quality</option>
                                    <option value="Hygiene">Hygiene & Cleanliness</option>
                                    <option value="Menu">Menu Suggestions</option>
                                    <option value="Staff">Staff Behavior</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none bg-gray-50 text-sm"
                                    placeholder="Tell us what's on your mind..."
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                            >
                                {submitting ? <Spinner size={18} className="text-white mx-auto" /> : (
                                    <>
                                        <Send size={18} className="mr-2" />
                                        Submit Feedback
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                )}
            </div>

            {/* Right Column: Feedback Feed */}
            <div className="w-full lg:flex-1 space-y-4 pt-1 lg:pt-14">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                        {isAdmin ? "All Received Feedback" : "Your Previous Feedback"}
                    </h3>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                        {feedbackList.length} total
                    </span>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center"><Spinner /></div>
                ) : feedbackList.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">It's quiet here</h3>
                        <p className="text-gray-500 mt-1">No feedback has been submitted yet.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {paginatedFeedback.map((feedback) => (
                                <Card key={feedback.id} className={`p-5 flex flex-col gap-3 ${feedback.status === 'Pending' ? 'bg-white' : 'bg-gray-50/50 opacity-80'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${categoryColors[feedback.category] || categoryColors['Other']}`}>
                                                {feedback.category}
                                            </span>
                                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                                <Clock size={12} />
                                                {format(new Date(feedback.createdAt), 'MMM dd, h:mm a')}
                                            </span>
                                        </div>

                                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${feedback.status === 'Reviewed' ? 'text-green-600 bg-green-50' : 'text-amber-500 bg-amber-50'
                                            }`}>
                                            {feedback.status === 'Reviewed' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {feedback.status}
                                        </span>
                                    </div>

                                    <p className="text-gray-700 text-sm leading-relaxed mt-1">{feedback.message}</p>

                                    {isAdmin && (
                                        <div className="pt-3 border-t border-gray-100 mt-2 flex justify-between items-center">
                                            <div className="text-xs font-medium text-gray-500">
                                                From: <span className="font-bold text-gray-800">{feedback.userName}</span> ({feedback.userRole})
                                            </div>
                                            {feedback.status === 'Pending' && (
                                                <Button
                                                    onClick={() => handleMarkReviewed(feedback.id)}
                                                    size="sm"
                                                    variant="secondary"
                                                    className="py-1 bg-white border border-gray-200 shadow-sm text-xs text-gray-700 hover:text-green-600 hover:border-green-200"
                                                >
                                                    <CheckCircle2 size={14} className="mr-1.5" />
                                                    Mark Reviewed
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                                <span className="text-gray-500">
                                    Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, feedbackList.length)}</span> of <span className="font-medium text-gray-900">{feedbackList.length}</span> results
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} size="sm" variant="secondary" className="bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 mr-2">
                                        Prev
                                    </Button>

                                    {[...Array(totalPages)].map((_, i) => {
                                        const page = i + 1;
                                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                            return (
                                                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>
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

export default Feedback;
