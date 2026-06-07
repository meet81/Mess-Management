import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

const Vendors = () => {
    const { user } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [formData, setFormData] = useState({
        vendorName: '',
        contactPerson: '',
        mobileNumber: '',
        email: '',
        address: '',
        suppliedItems: ''
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/vendors');
            setVendors(res.data);
        } catch (error) {
            toast.error('Failed to fetch vendors');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedVendor) {
                await axiosClient.put(`/vendors/${selectedVendor.vendorId}`, formData);
                toast.success('Vendor updated successfully');
            } else {
                await axiosClient.post('/vendors', formData);
                toast.success('Vendor added successfully');
            }
            setIsModalOpen(false);
            fetchVendors();
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data || 'Failed to save vendor');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vendor?')) return;
        try {
            await axiosClient.delete(`/vendors/${id}`);
            toast.success('Vendor deleted successfully');
            fetchVendors();
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data || 'Failed to delete vendor (may be in use)');
        }
    };

    const openModal = (vendor = null) => {
        setSelectedVendor(vendor);
        if (vendor) {
            setFormData({
                vendorName: vendor.vendorName || '',
                contactPerson: vendor.contactPerson || '',
                mobileNumber: vendor.mobileNumber || '',
                email: vendor.email || '',
                address: vendor.address || '',
                suppliedItems: vendor.suppliedItems || ''
            });
        } else {
            setFormData({
                vendorName: '',
                contactPerson: '',
                mobileNumber: '',
                email: '',
                address: '',
                suppliedItems: ''
            });
        }
        setIsModalOpen(true);
    };

    const filteredVendors = vendors.filter(v => 
        (v.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.suppliedItems || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (user?.role !== 'Admin' && user?.role !== 'Staff') {
        return <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Vendors Directory</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage vendor contacts and details</p>
                    </div>
                </div>
                {user?.role === 'Admin' && (
                    <button 
                        onClick={() => openModal()} 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 shadow-md shadow-indigo-500/20"
                    >
                        <Plus size={18} />
                        Add Vendor
                    </button>
                )}
            </div>

            {/* Vendor List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-800">All Vendors</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Vendor Name</th>
                                <th className="px-6 py-4">Contact Person</th>
                                <th className="px-6 py-4">Mobile</th>
                                <th className="px-6 py-4">Supplied Items</th>
                                {user?.role === 'Admin' && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading vendors...</td>
                                </tr>
                            ) : filteredVendors.map(vendor => (
                                <tr key={vendor.vendorId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800">{vendor.vendorName}</td>
                                    <td className="px-6 py-4 text-gray-600">{vendor.contactPerson || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{vendor.mobileNumber}</td>
                                    <td className="px-6 py-4 text-gray-600">{vendor.suppliedItems || '-'}</td>
                                    {user?.role === 'Admin' && (
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal(vendor)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(vendor.vendorId)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {!loading && filteredVendors.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No vendors found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">{selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Vendor Name *</label>
                                <input required type="text" value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Contact Person</label>
                                <input type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Mobile Number *</label>
                                <input required type="text" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Address</label>
                                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" rows="2"></textarea>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Supplied Items</label>
                                <input type="text" placeholder="e.g. Rice, Wheat, Vegetables" value={formData.suppliedItems} onChange={e => setFormData({...formData, suppliedItems: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">{selectedVendor ? 'Update Vendor' : 'Save Vendor'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;
