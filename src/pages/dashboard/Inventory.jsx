import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Plus, Search, AlertTriangle, Package, Edit, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

const Inventory = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [usages, setUsages] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    
    // Modal states
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({});
    const [vendorData, setVendorData] = useState({});
    const [stockData, setStockData] = useState({ type: 'Stock In', quantity: 0, remarks: '' });
    const [selectedItem, setSelectedItem] = useState(null);

    const categories = ['All', 'Vegetables', 'Fruits', 'Rice', 'Wheat', 'Pulses', 'Dairy', 'Oil', 'Spices', 'Cleaning Items', 'Kitchen Items', 'Other'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, vendorsRes, transRes, usageRes, plansRes] = await Promise.all([
                axiosClient.get(`/inventory`),
                axiosClient.get(`/vendors`),
                axiosClient.get(`/inventory/transactions`),
                axiosClient.get(`/inventory/vegetable-usage`),
                axiosClient.get(`/inventory/vegetable-plans`)
            ]);
            setItems(itemsRes.data);
            setVendors(vendorsRes.data);
            setTransactions(transRes.data);
            setUsages(usageRes.data);
            setPlans(plansRes.data);
        } catch (error) {
            toast.error('Failed to fetch inventory data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            quantity: Number(formData.quantity) || 0,
            minimumStock: Number(formData.minimumStock) || 0,
            safetyStock: Number(formData.safetyStock) || 0,
            purchasePrice: Number(formData.purchasePrice) || 0,
            vendorId: formData.vendorId ? Number(formData.vendorId) : null,
            expiryDate: formData.expiryDate || null,
            isPerishable: !!formData.isPerishable,
            isActive: !!formData.isActive,
            alertWhenLowStock: !!formData.alertWhenLowStock,
            useInMealPlanning: !!formData.useInMealPlanning
        };

        try {
            if (selectedItem) {
                await axiosClient.put(`/inventory/${selectedItem.inventoryId}`, payload);
                toast.success('Item updated successfully');
            } else {
                await axiosClient.post(`/inventory`, payload);
                toast.success('Item added successfully');
            }
            setIsItemModalOpen(false);
            setSelectedItem(null);
            fetchData();
        } catch (error) {
            toast.error('Error saving item');
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await axiosClient.delete(`/inventory/${id}`);
            toast.success('Item deleted');
            fetchData();
        } catch (error) {
            toast.error('Error deleting item');
        }
    };

    const handleSaveVendor = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post(`/vendors`, vendorData);
            toast.success('Vendor added successfully');
            setIsVendorModalOpen(false);
            setVendorData({});
            fetchData();
        } catch (error) {
            toast.error('Error adding vendor');
        }
    };

    const handleStockTransaction = async (e) => {
        e.preventDefault();
        const payload = {
            quantity: Number(stockData.quantity) || 0,
            remarks: stockData.remarks || ''
        };

        try {
            const endpoint = stockData.type === 'Stock In' ? 'stock-in' : 'stock-out';
            await axiosClient.post(`/inventory/${selectedItem.inventoryId}/${endpoint}`, payload);
            toast.success(`${stockData.type} successful`);
            setIsStockModalOpen(false);
            setSelectedItem(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data || 'Error processing transaction');
        }
    };

    const openItemModal = (item = null) => {
        setSelectedItem(item);
        if (item) {
            setFormData({
                itemName: item.itemName,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                minimumStock: item.minimumStock,
                safetyStock: item.safetyStock || item.minimumStock || 0,
                purchasePrice: item.purchasePrice,
                vendorId: item.vendorId || '',
                expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
                isPerishable: !!item.isPerishable,
                isActive: item.status !== 'Inactive',
                alertWhenLowStock: item.alertWhenLowStock !== false,
                useInMealPlanning: item.useInMealPlanning !== false
            });
        } else {
            setFormData({
                itemName: '', category: 'Vegetables', quantity: 0, unit: 'kg', minimumStock: 0, safetyStock: 0, purchasePrice: 0, vendorId: '', expiryDate: '',
                isPerishable: true, isActive: true, alertWhenLowStock: true, useInMealPlanning: true
            });
        }
        setIsItemModalOpen(true);
    };

    const openStockModal = (item, type) => {
        setSelectedItem(item);
        setStockData({ type, quantity: 0, remarks: '' });
        setIsStockModalOpen(true);
    };

    // Analytics Data Prep
    const filteredItems = items.filter(item => 
        (filterCategory === 'All' || item.category === filterCategory) &&
        (item.itemName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const lowStockItems = items.filter(i => i.quantity <= i.minimumStock);
    const expiredItems = items.filter(i => i.expiryDate && new Date(i.expiryDate) < new Date());
    const nearExpiryItems = items.filter(i => i.expiryDate && new Date(i.expiryDate) >= new Date() && new Date(i.expiryDate) <= new Date(Date.now() + 3 * 86400000));

    const categoryData = items.reduce((acc, item) => {
        const existing = acc.find(a => a.name === item.category);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: item.category, value: 1 });
        }
        return acc;
    }, []);

    const transactionData = transactions.slice(0, 10).map(t => ({
        date: new Date(t.date).toLocaleDateString(),
        type: t.type,
        quantity: t.quantity
    }));

    const plannedVsActualData = usages.slice(0, 10).map(u => ({
        name: u.vegetableName,
        planned: u.plannedQuantity,
        actual: u.actualUsedQuantity
    }));

    const wasteData = usages.filter(u => u.wastedQuantity >= 0).slice(0, 10).map(u => ({
        date: new Date(u.usageDate).toLocaleDateString(),
        wasted: u.wastedQuantity,
        name: u.vegetableName
    }));

    // Smart Predictions
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysPlans = plans.filter(p => p.planDate.startsWith(todayStr));
    const missingIngredients = todaysPlans.filter(p => {
        const item = items.find(i => i.inventoryId === p.vegetableId);
        return !item || item.quantity < p.requiredQuantity;
    });

    if (user?.role !== 'Admin' && user?.role !== 'Staff') {
        return <div className="p-8 text-center text-red-500">Access Denied</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage stock, vendors, and view analytics</p>
                </div>
                <div className="flex gap-3">
                    {user?.role === 'Admin' && <button onClick={() => setIsVendorModalOpen(true)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                        Add Vendor
                    </button>}
                    {user?.role === 'Admin' && <button onClick={() => openItemModal()} className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium flex items-center gap-2 shadow-md shadow-orange-500/20">
                        <Plus size={18} />
                        Add Item
                    </button>}
                </div>
            </div>

            {/* Dashboard Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Package size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Items</p>
                        <p className="text-2xl font-bold text-gray-800">{items.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Low Stock</p>
                        <p className="text-2xl font-bold text-gray-800">{lowStockItems.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Near Expiry</p>
                        <p className="text-2xl font-bold text-gray-800">{nearExpiryItems.length + expiredItems.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><ArrowDownCircle size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Vendors</p>
                        <p className="text-2xl font-bold text-gray-800">{vendors.length}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Category Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Transactions (Quantities)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={transactionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="quantity" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Smart Predictions Panel */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-blue-600" size={20} /> Today's Smart Alerts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Required Ingredients Today</p>
                        <p className="text-2xl font-bold text-blue-700">{todaysPlans.length} Planned Items</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Missing Ingredients Warning</p>
                        <p className="text-2xl font-bold text-red-600">{missingIngredients.length} Shortages</p>
                        {missingIngredients.length > 0 && (
                            <p className="text-xs text-red-500 mt-1">Requires immediate vendor order.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Planned vs Actual Usage</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={plannedVsActualData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="planned" fill="#3b82f6" name="Planned" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="actual" fill="#10b981" name="Actual" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Wasted Quantity</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={wasteData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="wasted" stroke="#ef4444" strokeWidth={3} name="Wasted Quantity" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Inventory List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-800">Inventory Items</h3>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
                            />
                        </div>
                        <select 
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Safety</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.map(item => (
                                <tr key={item.inventoryId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-800">{item.itemName}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.category}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.quantity} {item.unit}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.safetyStock || item.minimumStock} {item.unit}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                            item.stockStatus === 'In Stock' ? 'bg-green-100 text-green-700' :
                                            item.stockStatus === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {item.stockStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openStockModal(item, 'Stock In')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Stock In">
                                                <ArrowDownCircle size={18} />
                                            </button>
                                            <button onClick={() => openStockModal(item, 'Stock Out')} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="Stock Out">
                                                <ArrowUpCircle size={18} />
                                            </button>
                                            {user?.role === 'Admin' && <button onClick={() => openItemModal(item)} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                                                <Edit size={18} />
                                            </button>}
                                            {user?.role === 'Admin' && <button onClick={() => handleDeleteItem(item.inventoryId)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={18} />
                                            </button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No items found matching your criteria</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Item Modal */}
            {isItemModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">{selectedItem ? 'Edit Item' : 'Add New Item'}</h2>
                        <form onSubmit={handleSaveItem} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Item Name</label>
                                    <input required type="text" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Category</label>
                                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none">
                                        {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Initial Quantity</label>
                                    <input required type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" disabled={!!selectedItem} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Unit (kg, L, pack)</label>
                                    <input required type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Min Stock Alert</label>
                                    <input required type="number" step="0.01" value={formData.minimumStock} onChange={e => setFormData({...formData, minimumStock: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Safety Stock</label>
                                    <input required type="number" step="0.01" value={formData.safetyStock} onChange={e => setFormData({...formData, safetyStock: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Purchase Price</label>
                                    <input required type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Vendor</label>
                                    <select value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none">
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                                    <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={!!formData.isPerishable} onChange={e => setFormData({...formData, isPerishable: e.target.checked})} /> Is Perishable</label>
                                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={!!formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} /> Is Active</label>
                                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={!!formData.alertWhenLowStock} onChange={e => setFormData({...formData, alertWhenLowStock: e.target.checked})} /> Alert when low stock</label>
                                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={!!formData.useInMealPlanning} onChange={e => setFormData({...formData, useInMealPlanning: e.target.checked})} /> Use in meal planning</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-orange-600 rounded-xl hover:bg-orange-700">Save Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vendor Modal */}
            {isVendorModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Vendor</h2>
                        <form onSubmit={handleSaveVendor} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Vendor Name</label>
                                <input required type="text" value={vendorData.vendorName || ''} onChange={e => setVendorData({...vendorData, vendorName: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Contact Person</label>
                                <input type="text" value={vendorData.contactPerson || ''} onChange={e => setVendorData({...vendorData, contactPerson: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                                <input required type="text" value={vendorData.mobileNumber || ''} onChange={e => setVendorData({...vendorData, mobileNumber: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Supplied Items</label>
                                <input type="text" placeholder="e.g. Rice, Wheat" value={vendorData.suppliedItems || ''} onChange={e => setVendorData({...vendorData, suppliedItems: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsVendorModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-orange-600 rounded-xl hover:bg-orange-700">Save Vendor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Transaction Modal */}
            {isStockModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">{stockData.type}</h2>
                        <p className="text-sm text-gray-500 mb-6">Item: <span className="font-semibold text-gray-700">{selectedItem?.itemName}</span></p>
                        
                        <form onSubmit={handleStockTransaction} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Quantity ({selectedItem?.unit})</label>
                                <input required type="number" step="0.01" min="0.01" value={stockData.quantity} onChange={e => setStockData({...stockData, quantity: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Remarks</label>
                                <input type="text" value={stockData.remarks} onChange={e => setStockData({...stockData, remarks: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                                <button type="submit" className={`px-4 py-2 text-white rounded-xl ${stockData.type === 'Stock In' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
