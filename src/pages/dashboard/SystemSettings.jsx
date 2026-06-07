import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { Building2, Clock, QrCode, Package, Bell, Shield, Save, Check } from 'lucide-react';
import { toast } from 'react-toastify';

const SystemSettings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('org');

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/settings');
            setSettings(res.data);
        } catch (error) {
            toast.error('Failed to load system settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await axiosClient.put('/settings/update', { settings });
            toast.success('System settings updated successfully!');
            fetchSettings();
        } catch (error) {
            toast.error('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    const tabs = [
        { id: 'org', name: 'Organization', icon: <Building2 size={18} /> },
        { id: 'timings', name: 'Meal Timings', icon: <Clock size={18} /> },
        { id: 'qr', name: 'QR Attendance', icon: <QrCode size={18} /> },
        { id: 'inventory', name: 'Inventory Stock', icon: <Package size={18} /> },
        { id: 'notifications', name: 'Notifications', icon: <Bell size={18} /> },
        { id: 'security', name: 'Security & Access', icon: <Shield size={18} /> },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Configure your mess, QR authentication rules, notifications, and salary parameters.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tabs sidebar */}
                <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 border-b lg:border-b-0 border-gray-150">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/10'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Settings Panel */}
                <div className="flex-1">
                    <form onSubmit={handleSave}>
                        <Card className="p-6 md:p-8 bg-white border border-gray-100 shadow-sm rounded-2xl relative">
                            {activeTab === 'org' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-3">
                                        <h3 className="text-lg font-bold text-gray-900">Organization Settings</h3>
                                        <p className="text-gray-400 text-xs mt-0.5">Define organization identity, branding details, and legal registers.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Organization Name</label>
                                            <input type="text" value={settings['Org:Name'] || ''} onChange={e => handleChange('Org:Name', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Mess Name</label>
                                            <input type="text" value={settings['Org:MessName'] || ''} onChange={e => handleChange('Org:MessName', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Hostel Name</label>
                                            <input type="text" value={settings['Org:HostelName'] || ''} onChange={e => handleChange('Org:HostelName', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Contact Email</label>
                                            <input type="email" value={settings['Org:Email'] || ''} onChange={e => handleChange('Org:Email', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Mobile Number</label>
                                            <input type="text" value={settings['Org:Mobile'] || ''} onChange={e => handleChange('Org:Mobile', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">GST Number</label>
                                            <input type="text" value={settings['Org:GST'] || ''} onChange={e => handleChange('Org:GST', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm font-mono uppercase" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Registration Number</label>
                                            <input type="text" value={settings['Org:RegNo'] || ''} onChange={e => handleChange('Org:RegNo', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Logo URL</label>
                                            <input type="text" value={settings['Org:Logo'] || ''} placeholder="e.g. https://yourcdn.com/logo.png" onChange={e => handleChange('Org:Logo', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Address</label>
                                            <textarea rows="3" value={settings['Org:Address'] || ''} onChange={e => handleChange('Org:Address', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'timings' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-3">
                                        <h3 className="text-lg font-bold text-gray-900">Meal Timings Config</h3>
                                        <p className="text-gray-400 text-xs mt-0.5">Control operational hour segments, grace margins, and alert notifications.</p>
                                    </div>
                                    <div className="space-y-6">
                                        {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                                            <div key={meal} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                                                <div className="w-full md:w-32 shrink-0">
                                                    <span className="font-bold text-gray-800 text-base">{meal} Timing</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 w-full">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Time</label>
                                                        <input type="time" value={settings[`Meal:${meal}:Start`] || ''} onChange={e => handleChange(`Meal:${meal}:Start`, e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Time</label>
                                                        <input type="time" value={settings[`Meal:${meal}:End`] || ''} onChange={e => handleChange(`Meal:${meal}:End`, e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                    </div>
                                                    <div className="col-span-2 md:col-span-1">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Grace Period (Mins)</label>
                                                        <input type="number" min="0" value={settings[`Meal:${meal}:Grace`] || '0'} onChange={e => handleChange(`Meal:${meal}:Grace`, e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-4 border-t border-gray-150 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                                <input type="checkbox" checked={settings['Meal:AutoCloseAttendance'] === 'true'} onChange={e => handleChange('Meal:AutoCloseAttendance', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                                <div className="text-sm font-semibold text-gray-700">Auto Close Attendance</div>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                                <input type="checkbox" checked={settings['Meal:EnableLateEntry'] === 'true'} onChange={e => handleChange('Meal:EnableLateEntry', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                                <div className="text-sm font-semibold text-gray-700">Enable Late Entry</div>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                                <input type="checkbox" checked={settings['Meal:EnableMealReminder'] === 'true'} onChange={e => handleChange('Meal:EnableMealReminder', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                                <div className="text-sm font-semibold text-gray-700">Enable Meal Reminders</div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'qr' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-3">
                                        <h3 className="text-lg font-bold text-gray-900">QR Attendance Settings</h3>
                                        <p className="text-gray-400 text-xs mt-0.5">Set validation triggers, token expiry windows, and duplicate scan preventions.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">QR Expiry Time (Secs)</label>
                                            <input type="number" min="1" value={settings['Qr:ExpiryTime'] || '60'} onChange={e => handleChange('Qr:ExpiryTime', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Duplicate Interval (Secs)</label>
                                            <input type="number" min="1" value={settings['Qr:DuplicateScanInterval'] || '600'} onChange={e => handleChange('Qr:DuplicateScanInterval', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Max Scan Attempts</label>
                                            <input type="number" min="1" value={settings['Qr:MaxScanAttempts'] || '3'} onChange={e => handleChange('Qr:MaxScanAttempts', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-150 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                            <input type="checkbox" checked={settings['Qr:Enable'] === 'true'} onChange={e => handleChange('Qr:Enable', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Enable QR Attendance</div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                            <input type="checkbox" checked={settings['Qr:PreventDuplicate'] === 'true'} onChange={e => handleChange('Qr:PreventDuplicate', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Prevent Duplicate Attendance</div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                            <input type="checkbox" checked={settings['Qr:EnableFaceVerification'] === 'true'} onChange={e => handleChange('Qr:EnableFaceVerification', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Enable Face Verification (Biometric)</div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                            <input type="checkbox" checked={settings['Qr:RequireLiveVerification'] === 'true'} onChange={e => handleChange('Qr:RequireLiveVerification', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Require Live Verification</div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'inventory' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-3">
                                        <h3 className="text-lg font-bold text-gray-900">Inventory Settings</h3>
                                        <p className="text-gray-400 text-xs mt-0.5">Control automatic safety stock allocations, alerts, and automatic deductions.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Default Safety Stock (%)</label>
                                            <input type="number" min="0" value={settings['Inventory:DefaultSafetyStock'] || '10'} onChange={e => handleChange('Inventory:DefaultSafetyStock', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Min Stock Alert Threshold (%)</label>
                                            <input type="number" min="0" value={settings['Inventory:MinThreshold'] || '5'} onChange={e => handleChange('Inventory:MinThreshold', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Expiry Alert (Days Before)</label>
                                            <input type="number" min="1" value={settings['Inventory:ExpiryAlertDays'] || '3'} onChange={e => handleChange('Inventory:ExpiryAlertDays', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-150 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                            <input type="checkbox" checked={settings['Inventory:AutoDeduction'] === 'true'} onChange={e => handleChange('Inventory:AutoDeduction', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Auto Deduct Stock on Scan (Recommended)</div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                            <input type="checkbox" checked={settings['Inventory:AutoVendorSuggestions'] === 'true'} onChange={e => handleChange('Inventory:AutoVendorSuggestions', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Auto Vendor Order Suggestions</div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                            <input type="checkbox" checked={settings['Inventory:EnableLowStockAlert'] === 'true'} onChange={e => handleChange('Inventory:EnableLowStockAlert', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Enable Low Stock System Alerts</div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/70 transition-colors">
                                            <input type="checkbox" checked={settings['Inventory:EnableExpiryNotifications'] === 'true'} onChange={e => handleChange('Inventory:EnableExpiryNotifications', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Enable Expiry Notifications</div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-3">
                                        <h3 className="text-lg font-bold text-gray-900">Notification Channels</h3>
                                        <p className="text-gray-400 text-xs mt-0.5">Toggle active alerts and communications channels.</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        {['Email', 'SMS', 'Push', 'WhatsApp'].map(channel => (
                                            <label key={channel} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 border border-gray-100 select-none">
                                                <input type="checkbox" checked={settings[`Notification:${channel}`] === 'true'} onChange={e => handleChange(`Notification:${channel}`, e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mb-2" />
                                                <span className="text-sm font-semibold text-gray-800">{channel}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="border-t border-gray-150 pt-5 space-y-4">
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Trigger Events</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                <input type="checkbox" checked={settings['Notification:Alert:LowStock'] === 'true'} onChange={e => handleChange('Notification:Alert:LowStock', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                                <div className="text-sm font-semibold text-gray-700">Low Stock Trigger Alerts</div>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                <input type="checkbox" checked={settings['Notification:Alert:VendorDelay'] === 'true'} onChange={e => handleChange('Notification:Alert:VendorDelay', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                                <div className="text-sm font-semibold text-gray-700">Vendor Delivery Delay Notices</div>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                <input type="checkbox" checked={settings['Notification:Alert:MealChange'] === 'true'} onChange={e => handleChange('Notification:Alert:MealChange', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                                <div className="text-sm font-semibold text-gray-700">Instant Meal Change Notifications</div>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                <input type="checkbox" checked={settings['Notification:Alert:Complaint'] === 'true'} onChange={e => handleChange('Notification:Alert:Complaint', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                                <div className="text-sm font-semibold text-gray-700">Complaint Escalation Alerts</div>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                <input type="checkbox" checked={settings['Notification:Alert:SalaryGenerated'] === 'true'} onChange={e => handleChange('Notification:Alert:SalaryGenerated', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                                <div className="text-sm font-semibold text-gray-700">Salary Generated Notice to Staff</div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-3">
                                        <h3 className="text-lg font-bold text-gray-900">Security Parameters</h3>
                                        <p className="text-gray-400 text-xs mt-0.5">Control token lifetimes, password expirations, and multi-factor authentications.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Session Timeout (Mins)</label>
                                            <input type="number" min="5" value={settings['Security:SessionTimeout'] || '30'} onChange={e => handleChange('Security:SessionTimeout', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password Expiry (Days)</label>
                                            <input type="number" min="30" value={settings['Security:PasswordExpiry'] || '90'} onChange={e => handleChange('Security:PasswordExpiry', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Max Login Attempts</label>
                                            <input type="number" min="3" value={settings['Security:MaxLoginAttempts'] || '5'} onChange={e => handleChange('Security:MaxLoginAttempts', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm" />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-150 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                            <input type="checkbox" checked={settings['Security:TwoFactor'] === 'true'} onChange={e => handleChange('Security:TwoFactor', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Require Two-Factor Auth (2FA)</div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                            <input type="checkbox" checked={settings['Security:RoleBasedAccess'] === 'true'} onChange={e => handleChange('Security:RoleBasedAccess', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Strict Role-Based Access Control</div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                            <input type="checkbox" checked={settings['Security:ActivityLogging'] === 'true'} onChange={e => handleChange('Security:ActivityLogging', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Log User Activity Details</div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                            <input type="checkbox" checked={settings['Security:DeviceVerification'] === 'true'} onChange={e => handleChange('Security:DeviceVerification', e.target.checked ? 'true' : 'false')} className="w-4.5 h-4.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                            <div className="text-sm font-semibold text-gray-700">Lock Scanner Hardware Registers</div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end gap-3">
                                <Button type="submit" disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all flex items-center gap-2 border-0">
                                    {saving ? <Spinner size="sm" /> : <Save size={18} />}
                                    {saving ? 'Saving...' : 'Save Configuration'}
                                </Button>
                            </div>
                        </Card>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
