import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { Search, Plus, Edit2, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'react-toastify';

const Menu = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        dayOfWeek: 'Monday',
        breakfast: '',
        lunch: '',
        dinner: ''
    });

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/menu');
            setMenus(res.data);
        } catch (error) {
            toast.error('Failed to load menu data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const handleOpenForm = (menu = null) => {
        if (menu) {
            setEditingId(menu.id);
            setFormData({
                dayOfWeek: menu.dayOfWeek,
                breakfast: menu.breakfast,
                lunch: menu.lunch,
                dinner: menu.dinner
            });
        } else {
            setEditingId(null);
            setFormData({ dayOfWeek: 'Monday', breakfast: '', lunch: '', dinner: '' });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axiosClient.put(`/menu/${editingId}`, formData);
                toast.success(`Updated menu for ${formData.dayOfWeek}`);
            } else {
                await axiosClient.post('/menu', formData);
                toast.success(`Added new menu for ${formData.dayOfWeek}`);
            }
            handleCloseForm();
            fetchMenu();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save menu.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this specific menu plan?")) return;
        try {
            await axiosClient.delete(`/menu/${id}`);
            toast.success("Menu item deleted.");
            fetchMenu();
        } catch (error) {
            toast.error('Failed to delete menu.');
        }
    };

    const filteredMenus = menus.filter(m =>
        m.dayOfWeek.toLowerCase().includes(search.toLowerCase()) ||
        m.lunch.toLowerCase().includes(search.toLowerCase())
    );

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    if (loading && !menus.length) {
        return <div className="h-full flex items-center justify-center"><Spinner size={40} /></div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Weekly Menu</h1>
                    <p className="text-gray-500 text-sm mt-1">Review the meal plan and daily offerings.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by day or dish..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    {isAdmin && (
                        <Button onClick={() => handleOpenForm()} className="whitespace-nowrap">
                            <Plus size={18} className="mr-2" />
                            Add Menu
                        </Button>
                    )}
                </div>
            </div>

            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMenus.map((menu) => (
                    <Card key={menu.id} className="hover:border-orange-200 transition-colors flex flex-col">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <CalendarDays size={20} className="text-orange-500" />
                                <h3 className="font-bold text-gray-900 text-lg">{menu.dayOfWeek}</h3>
                            </div>

                            {/* Admin Actions */}
                            {isAdmin && (
                                <div className="flex gap-1.5 pt-0.5">
                                    <button
                                        onClick={() => handleOpenForm(menu)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(menu.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-5 space-y-4 flex-1">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Breakfast (8:00 AM)</p>
                                <p className="text-gray-800 font-medium">{menu.breakfast}</p>
                            </div>
                            <div className="pt-2 border-t border-gray-50">
                                <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Lunch (1:00 PM)</p>
                                <p className="text-gray-800 font-medium">{menu.lunch}</p>
                            </div>
                            <div className="pt-2 border-t border-gray-50">
                                <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Dinner (8:00 PM)</p>
                                <p className="text-gray-800 font-medium">{menu.dinner}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredMenus.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <Utensils size={40} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No menu items found</h3>
                    <p className="text-gray-500 mt-1">Try adjusting your search query.</p>
                </div>
            )}

            {/* Admin Add/Edit Modal */}
            {isFormOpen && isAdmin && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Edit Daily Menu' : 'Add Daily Menu'}
                            </h2>
                            <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                                <select
                                    value={formData.dayOfWeek}
                                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    required
                                >
                                    {daysOfWeek.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Breakfast Menu</label>
                                <textarea
                                    value={formData.breakfast}
                                    onChange={(e) => setFormData({ ...formData, breakfast: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                                    rows={2}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lunch Menu</label>
                                <textarea
                                    value={formData.lunch}
                                    onChange={(e) => setFormData({ ...formData, lunch: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                                    rows={2}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dinner Menu</label>
                                <textarea
                                    value={formData.dinner}
                                    onChange={(e) => setFormData({ ...formData, dinner: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                                    rows={2}
                                    required
                                />
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <Button type="button" variant="secondary" onClick={handleCloseForm}>Cancel</Button>
                                <Button type="submit">Save Menu</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Menu;
