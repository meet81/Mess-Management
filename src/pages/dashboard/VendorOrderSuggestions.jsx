import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, AlertTriangle, CheckCircle, Info, ChevronRight, RefreshCw } from 'lucide-react';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';

const VendorOrderSuggestions = () => {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [targetDate, setTargetDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]); // Tomorrow

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            // Fetch dynamically computed suggestions
            const res = await axiosClient.get(`/vendor-orders/suggestions?date=${targetDate}`);
            setSuggestions(res.data);
        } catch (error) {
            toast.error('Failed to load vendor order suggestions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [targetDate]);

    const handleGenerateSuggestions = async () => {
        try {
            setLoading(true);
            // Call generate suggestions API
            const res = await axiosClient.post(`/vendor-order-suggestions/generate?date=${targetDate}`);
            setSuggestions(res.data);
            toast.success('Generated and saved fresh suggestions!');
        } catch (error) {
            toast.error('Failed to generate suggestions.');
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrders = async () => {
        const ordersToPlace = suggestions.filter(s => Number(s.suggestedOrderQuantity || s.suggestedQuantity || 0) > 0);
        if (ordersToPlace.length === 0) {
            toast.info('No suggestions have ordering quantities.');
            return;
        }

        try {
            setLoading(true);
            await Promise.all(ordersToPlace.map(order => axiosClient.post('/vendor-orders', {
                vendorId: order.preferredVendorId,
                vendorName: order.preferredVendorName,
                ingredientId: order.ingredientId || order.vegetableId,
                ingredientName: order.ingredientName || order.vegetableName,
                quantity: order.suggestedOrderQuantity || order.suggestedQuantity,
                unit: order.unit,
                rate: order.lastPurchaseRate,
                expectedDeliveryDate: targetDate,
                status: 'Pending',
                requiresAdminApproval: user?.role !== 'Admin'
            })));
            toast.success(`Successfully placed ${ordersToPlace.length} orders!`);
            fetchSuggestions();
        } catch (error) {
            toast.error('Failed to place some vendor orders.');
        } finally {
            setLoading(false);
        }
    };

    const getRecommendationBadge = (status) => {
        switch (status) {
            case 'Order Now':
            case 'Low Stock Alert':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><AlertTriangle size={12}/> Order Now</span>;
            case 'Use Existing Stock':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle size={12}/> Safe Stock</span>;
            case 'Overstock Alert':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"><Info size={12}/> Overstocked</span>;
            case 'Near Expiry Use First':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><Info size={12}/> Near Expiry</span>;
            case 'Order Placed':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700"><CheckCircle size={12}/> Ordered</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    if (user?.role !== 'Admin' && user?.role !== 'Staff') {
        return <div className="p-8 text-center text-red-500">Access Denied</div>;
    }

    const totalEstimatedCost = suggestions.reduce((sum, s) => sum + Number(s.estimatedCost || 0), 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Vendor Order Suggestions</h1>
                    <p className="text-gray-500 text-sm mt-1">Smart replenishment recommendations for tomorrow's meals</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <input
                        type="date"
                        value={targetDate}
                        onChange={e => setTargetDate(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                    <Button onClick={handleGenerateSuggestions} variant="secondary" className="flex items-center gap-2">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Regenerate
                    </Button>
                    <Button onClick={handlePlaceOrders} className="flex items-center gap-2">
                        <ShoppingCart size={18} />
                        Convert to Orders
                    </Button>
                </div>
            </div>

            {/* Suggestions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Ingredient Name</th>
                                <th className="px-6 py-4 text-right">Available Stock</th>
                                <th className="px-6 py-4 text-right">Tomorrow Required</th>
                                <th className="px-6 py-4 text-right">Safety Stock</th>
                                <th className="px-6 py-4 text-right">Suggested Order</th>
                                <th className="px-6 py-4">Preferred Vendor</th>
                                <th className="px-6 py-4 text-right">Est. Cost</th>
                                <th className="px-6 py-4">Recommendation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {suggestions.map((s, idx) => {
                                const suggestedQty = s.suggestedOrderQuantity || s.suggestedQuantity || 0;
                                const isRequiredOrder = suggestedQty > 0;
                                return (
                                    <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${isRequiredOrder ? 'bg-orange-50/20' : ''}`}>
                                        <td className="px-6 py-4 font-bold text-gray-800">{s.vegetableName || s.ingredientName}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-600">{Number(s.availableStock || 0).toFixed(2)} {s.unit}</td>
                                        <td className="px-6 py-4 text-right font-medium text-blue-600">{Number(s.nextDayRequiredQuantity || s.tomorrowRequiredQuantity || 0).toFixed(2)} {s.unit}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-600">{Number(s.safetyStock || 0).toFixed(2)} {s.unit}</td>
                                        <td className="px-6 py-4 text-right font-bold text-orange-600">
                                            {suggestedQty > 0 ? `+${Number(suggestedQty).toFixed(2)} ${s.unit}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{s.preferredVendorName || 'No Vendor Linked'}</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-700">₹{Number(s.estimatedCost || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4">{getRecommendationBadge(s.recommendationStatus)}</td>
                                    </tr>
                                );
                            })}
                            {suggestions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        <Info size={40} className="mx-auto text-gray-300 mb-3" />
                                        <h3 className="text-lg font-medium text-gray-900">No suggestions calculated for this date</h3>
                                        <p className="text-gray-500 mt-1">Please ensure meal plans are created for {new Date(targetDate).toLocaleDateString()}.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {suggestions.length > 0 && (
                            <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-right text-gray-800">Total Estimated Cost:</td>
                                    <td colSpan="2" className="px-6 py-4 text-left text-green-700 text-lg">₹{totalEstimatedCost.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorOrderSuggestions;
