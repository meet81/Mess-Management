import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card, Spinner, Button } from '../../components/ui/BaseComponents';
import { Search, ShieldAlert, User as UserIcon, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'Student'
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/user');
            setUsers(res.data);
        } catch (error) {
            toast.error('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await axiosClient.get('/roles');
            const activeRoles = res.data.filter(role => role.status === 'Active');
            setRoles(activeRoles);
            if (activeRoles.length > 0) {
                setFormData(current => ({
                    ...current,
                    role: activeRoles.some(role => role.roleName === current.role) ? current.role : activeRoles[0].roleName
                }));
            }
        } catch {
            toast.error('Failed to load roles.');
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            // Hits the existing registration API endpoint
            await axiosClient.post('/auth/register', formData);
            toast.success(`${formData.role} registered successfully!`);
            setIsAddModalOpen(false);
            setFormData({ fullName: '', email: '', password: '', role: roles[0]?.roleName || '' });
            fetchUsers(); // Refresh the table to show the new user
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to register user.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
            (u.fullName && u.fullName.toLowerCase().includes(term)) ||
            (u.email && u.email.toLowerCase().includes(term)) ||
            (u.role && u.role.toLowerCase().includes(term))
        );
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in p-2 sm:p-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        Manage Users
                        <span className="bg-blue-100 text-blue-700 text-sm py-1 px-3 rounded-full font-semibold shadow-sm">{users.length} Registered</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">View all registered Students, Staff, and Admins.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto whitespace-nowrap bg-blue-600 hover:bg-blue-700">
                        <Plus size={18} className="mr-2" />
                        Register User
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden shadow-sm border border-gray-100">
                {loading ? (
                    <div className="h-64 flex items-center justify-center"><Spinner /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-semibold">User ID</th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Password</th>
                                    <th className="p-4 font-semibold">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 text-gray-500">#{u.id}</td>
                                            <td className="p-4 font-medium text-gray-900">{u.fullName}</td>
                                            <td className="p-4">{u.email}</td>
                                            <td className="p-4 text-xs font-mono text-gray-400 break-all max-w-xs" title="Passwords are securely hashed using BCrypt">{u.passwordHash || 'N/A'}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'Admin' ? 'bg-orange-100 text-orange-700' : u.role === 'Staff' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {u.role === 'Admin' ? <ShieldAlert size={14} /> : <UserIcon size={14} />} {u.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white shadow-2xl border-0">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h2 className="text-xl font-bold text-gray-900">Register New User</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                                    {roles.map(role => (
                                        <option key={role.roleId} value={role.roleName}>{role.roleName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                                    {submitting ? <Spinner size="sm" /> : 'Register'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Users;
