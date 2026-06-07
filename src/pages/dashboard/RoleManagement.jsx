import React, { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Button, Card, Spinner } from '../../components/ui/BaseComponents';
import { groupPermissionsByModule } from '../../utils/permissions';
import { Save, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const permissionActions = ['View', 'Read', 'Create', 'Edit', 'Update', 'Delete', 'Approve', 'Export'];

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [formData, setFormData] = useState({
        roleName: '',
        description: '',
        status: 'Active',
        isSystemRole: false,
        allowDashboardAccess: true,
        permissionIds: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [newModuleName, setNewModuleName] = useState('');
    const [addingModule, setAddingModule] = useState(false);

    const groupedPermissions = useMemo(() => groupPermissionsByModule(permissions), [permissions]);
    const moduleEntries = useMemo(
        () => Object.entries(groupedPermissions).sort(([a], [b]) => a.localeCompare(b)),
        [groupedPermissions]
    );

    const loadData = async () => {
        try {
            setLoading(true);
            const [rolesResponse, permissionsResponse] = await Promise.all([
                axiosClient.get('/roles'),
                axiosClient.get('/permissions')
            ]);
            setRoles(rolesResponse.data);
            setPermissions(permissionsResponse.data);
        } catch {
            toast.error('Failed to load role permissions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const selectRole = (roleId) => {
        setSelectedRoleId(roleId);
        const role = roles.find(item => item.roleId === Number(roleId));
        if (!role) {
            setFormData({
                roleName: '',
                description: '',
                status: 'Active',
                isSystemRole: false,
                allowDashboardAccess: true,
                permissionIds: []
            });
            return;
        }

        setFormData({
            roleName: role.roleName,
            description: role.description || '',
            status: role.status,
            isSystemRole: role.isSystemRole,
            allowDashboardAccess: role.allowDashboardAccess,
            permissionIds: role.permissions.map(permission => permission.permissionId)
        });
    };

    const togglePermission = (permissionId) => {
        setFormData(current => ({
            ...current,
            permissionIds: current.permissionIds.includes(permissionId)
                ? current.permissionIds.filter(id => id !== permissionId)
                : [...current.permissionIds, permissionId]
        }));
    };

    const saveRole = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            if (selectedRoleId) {
                await axiosClient.put(`/roles/${selectedRoleId}`, formData);
                toast.success('Role permissions updated.');
            } else {
                await axiosClient.post('/roles', formData);
                toast.success('Role created.');
            }
            await loadData();
            selectRole('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save role.');
        } finally {
            setSaving(false);
        }
    };

    const deleteRole = async () => {
        if (!selectedRoleId) return;
        const roleName = formData.roleName;
        if (!window.confirm(`Delete role "${roleName}"?`)) return;

        try {
            setDeleting(true);
            await axiosClient.delete(`/roles/${selectedRoleId}`);
            toast.success('Role deleted.');
            await loadData();
            selectRole('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete role.');
        } finally {
            setDeleting(false);
        }
    };

    const addModule = async (event) => {
        event.preventDefault();
        const moduleName = newModuleName.trim();
        if (!moduleName) {
            toast.error('Enter a module name.');
            return;
        }

        try {
            setAddingModule(true);
            await axiosClient.post('/permissions/modules', { moduleName });
            toast.success(`${moduleName} module added.`);
            setNewModuleName('');
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add module.');
        } finally {
            setAddingModule(false);
        }
    };

    if (loading) {
        return <div className="h-64 flex items-center justify-center"><Spinner /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <ShieldAlert size={26} className="text-orange-500" />
                    Role Permissions
                </h1>
                <p className="text-gray-500 text-sm mt-1">Create custom roles and assign module-level actions.</p>
            </div>

            <Card className="p-4">
                <form onSubmit={addModule} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Add Module</label>
                        <input
                            value={newModuleName}
                            onChange={e => setNewModuleName(e.target.value)}
                            placeholder="Kitchen Manager, Audit Logs, Notifications..."
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <Button type="submit" disabled={addingModule} className="bg-gray-900 hover:bg-gray-800">
                        {addingModule ? <Spinner size="sm" /> : 'Add Module'}
                    </Button>
                </form>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                <Card className="p-4 h-fit">
                    <Button onClick={() => selectRole('')} className="w-full mb-4 bg-orange-500 hover:bg-orange-600">
                        New Role
                    </Button>
                    <div className="space-y-2">
                        {roles.map(role => (
                            <button
                                key={role.roleId}
                                onClick={() => selectRole(role.roleId)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${Number(selectedRoleId) === role.roleId ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-100 hover:bg-gray-50 text-gray-700'}`}
                            >
                                <span className="font-semibold block">{role.roleName}</span>
                                <span className="text-xs text-gray-500">{role.status}</span>
                            </button>
                        ))}
                    </div>
                </Card>

                <form onSubmit={saveRole} className="space-y-6">
                    <Card className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                            <input required value={formData.roleName} onChange={e => setFormData({ ...formData, roleName: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" rows={2} />
                        </div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <input type="checkbox" checked={formData.allowDashboardAccess} onChange={e => setFormData({ ...formData, allowDashboardAccess: e.target.checked })} />
                            Allow Dashboard Access
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <input type="checkbox" checked={formData.isSystemRole} onChange={e => setFormData({ ...formData, isSystemRole: e.target.checked })} />
                            System Role
                        </label>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="p-4 text-left">Module</th>
                                        {permissionActions.map(action => (
                                            <th key={action} className="p-4 text-center">{action}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {moduleEntries.map(([moduleName, modulePermissions]) => (
                                        <tr key={moduleName}>
                                            <td className="p-4 font-semibold text-gray-800">{moduleName}</td>
                                            {permissionActions.map(action => {
                                                const permission = modulePermissions.find(item => item.permissionType === action);
                                                return (
                                                    <td key={action} className="p-4 text-center">
                                                        {permission && (
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissionIds.includes(permission.permissionId)}
                                                                onChange={() => togglePermission(permission.permissionId)}
                                                                className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                        {selectedRoleId ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={deleteRole}
                                disabled={deleting || formData.isSystemRole}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                                {deleting ? <Spinner size="sm" /> : <><Trash2 size={16} className="mr-2" /> Delete Role</>}
                            </Button>
                        ) : <span />}
                        <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                            {saving ? <Spinner size="sm" /> : <><Save size={16} className="mr-2" /> Save Role</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoleManagement;
