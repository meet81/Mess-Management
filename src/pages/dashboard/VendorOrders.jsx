import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, CheckCircle, Clock, XCircle, Search, Plus, Filter, Calendar } from 'lucide-react';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';

const VendorOrders = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [orders, setOrders] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Create Order Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        vendorId: '',
        vendorName: '',
        ingredientId: '',
        ingredientName: '',
        quantity: 1,
        unit: 'kg',
        rate: 0,
        expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });

    const statusOptions = ['All', 'Pending', 'Ordered', 'Delivered', 'Cancelled'];

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const [ordersRes, vendorsRes, inventoryRes] = await Promise.all([
                axiosClient.get('/vendor-orders'),
                axiosClient.get('/vendors'),
                axiosClient.get('/inventory')
            ]);
            setOrders(ordersRes.data);
            setVendors(vendorsRes.data);
            setIngredients(inventoryRes.data.filter(i => i.status === 'Active'));
        } catch (error) {
            toast.error('Failed to load vendor orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleIngredientChange = (e) => {
        const id = Number(e.target.value);
        const selected = ingredients.find(i => i.inventoryId === id);
        if (selected) {
            setFormData({
                ...formData,
                ingredientId: id,
                ingredientName: selected.itemName,
                unit: selected.unit,
                rate: selected.purchasePrice,
                vendorId: selected.vendorId || ''
            });
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            if (newStatus === 'Delivered') {
                // Call the delivered endpoint directly to deduct/update inventory stock
                await axiosClient.put(`/vendor-orders/delivered/${orderId}`);
                toast.success('Order marked as delivered! Inventory stock updated successfully.');
            } else {
                await axiosClient.put(`/vendor-orders/${orderId}/status`, { status: newStatus });
                toast.success(`Order status updated to ${newStatus}`);
            }
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to update order status.');
        }
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (!formData.ingredientId) {
            toast.warning('Please select an ingredient.');
            return;
        }

        const vendor = vendors.find(v => v.vendorId === Number(formData.vendorId));
        const payload = {
            vendorId: formData.vendorId ? Number(formData.vendorId) : null,
            vendorName: vendor ? vendor.vendorName : formData.vendorName || 'Manual Vendor',
            ingredientId: Number(formData.ingredientId),
            ingredientName: formData.ingredientName,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            rate: Number(formData.rate),
            expectedDeliveryDate: formData.expectedDeliveryDate,
            status: 'Pending'
        };

        try {
            await axiosClient.post('/vendor-orders', payload);
            toast.success('Vendor order created successfully.');
            setIsModalOpen(false);
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to create vendor order.');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered':
                return <CheckCircle size={16} className="text-green-500" />;
            case 'Pending':
            case 'Ordered':
                return <Clock size={16} className="text-amber-500 animate-pulse" />;
            case 'Cancelled':
                return <XCircle size={16} className="text-red-500" />;
            default:
                return <Info size={16} className="text-gray-400" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Delivered':
                return 'bg-green-100 text-green-700';
            case 'Ordered':
                return 'bg-blue-100 text-blue-700';
            case 'Pending':
                return 'bg-amber-100 text-amber-700';
            case 'Cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.ingredientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            `#${order.vendorOrderId}`.includes(searchTerm);
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading && !orders.length) {
        return <div className="h-full flex items-center justify-center"><Spinner size={40} /></div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Vendor Orders Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Track and manage supply orders placed with vendors</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsModalOpen(true)} className="whitespace-nowrap flex items-center gap-2">
                        <Plus size={18} />
                        Create Manual Order
                    </Button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Order ID, vendor, or ingredient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div className="flex gap-2 items-center">
                    <Filter size={16} className="text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                    >
                        {statusOptions.map(opt => <option key={opt} value={opt}>{opt} Orders</option>)}
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Vendor Name</th>
                                <th className="px-6 py-4">Ingredient</th>
                                <th className="px-6 py-4 text-right">Quantity</th>
                                <th className="px-6 py-4 text-right">Rate</th>
                                <th className="px-6 py-4 text-right">Total Amount</th>
                                <th className="px-6 py-4">Order Date</th>
                                <th className="px-6 py-4">Delivery Date</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map(order => (
                                <tr key={order.vendorOrderId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800">#{order.vendorOrderId}</td>
                                    <td className="px-6 py-4 text-gray-700 font-medium">{order.vendorName || order.vendor?.vendorName}</td>
                                    <td className="px-6 py-4 text-gray-800 font-bold">{order.ingredientName}</td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-600">{Number(order.quantity).toFixed(2)} {order.unit}</td>
                                    <td className="px-6 py-4 text-right text-gray-500">₹{Number(order.rate).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-700">₹{Number(order.totalAmount).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-gray-600">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-gray-600">{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {isAdmin && order.status !== 'Delivered' && order.status !== 'Cancelled' ? (
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.vendorOrderId, e.target.value)}
                                                    className={`px-2 py-1 rounded text-xs font-semibold outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer ${getStatusBadge(order.status)}`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Ordered">Ordered</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    {order.status}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                                        <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
                                        <h3 className="text-lg font-medium text-gray-900">No vendor orders found</h3>
                                        <p className="text-gray-500 mt-1">Try adjusting your filters or create a new order.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Order Modal */}
            {isModalOpen && isAdmin && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <Card className="w-full max-w-md bg-white shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Create Vendor Order</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Select Ingredient</label>
                                <select
                                    required
                                    value={formData.ingredientId}
                                    onChange={handleIngredientChange}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                >
                                    <option value="">Select Ingredient...</option>
                                    {ingredients.map(i => <option key={i.inventoryId} value={i.inventoryId}>{i.itemName}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Preferred Vendor</label>
                                <select
                                    value={formData.vendorId}
                                    onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                >
                                    <option value="">Select Vendor...</option>
                                    {vendors.map(v => <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Quantity</label>
                                    <input
                                        required
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Unit</label>
                                    <input
                                        readOnly
                                        type="text"
                                        value={formData.unit}
                                        className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-gray-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Rate per Unit (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.rate}
                                        onChange={e => setFormData({ ...formData, rate: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Expected Delivery</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.expectedDeliveryDate}
                                        onChange={e => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-orange-50 rounded-xl text-sm border border-orange-100 flex justify-between font-semibold">
                                <span className="text-orange-800">Total Amount:</span>
                                <span className="text-orange-950">₹{(Number(formData.quantity) * Number(formData.rate)).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-orange-600 rounded-xl hover:bg-orange-700 text-sm">Create Order</button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default VendorOrders;
