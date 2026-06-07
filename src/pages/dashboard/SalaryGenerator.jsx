import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import { RefreshCw, Calculator, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const SalaryGenerator = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [date, setDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    
    // Custom staff overrides
    const [overrides, setOverrides] = useState({});

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/user');
            const staff = res.data.filter(u => u.role === 'Staff');
            setStaffList(staff);
            
            // Initialize overrides
            const initialOverrides = {};
            staff.forEach(s => {
                initialOverrides[s.id] = {
                    overtimeHours: 0,
                    bonus: 0,
                    deductions: 0
                };
            });
            setOverrides(initialOverrides);
        } catch (error) {
            toast.error('Failed to load staff list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleOverrideChange = (userId, field, value) => {
        setOverrides(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [field]: parseFloat(value) || 0
            }
        }));
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        try {
            setGenerating(true);
            const staffInputs = Object.keys(overrides).map(userId => ({
                userId: parseInt(userId),
                overtimeHours: overrides[userId].overtimeHours,
                bonus: overrides[userId].bonus,
                deductions: overrides[userId].deductions
            }));

            await axiosClient.post('/payroll/generate', {
                month: date.month,
                year: date.year,
                staffInputs
            });

            toast.success(`Salaries for ${format(new Date(date.year, date.month - 1), 'MMMM yyyy')} calculated and drafted!`);
        } catch (error) {
            toast.error(error.response?.data || 'Failed to generate salaries.');
        } finally {
            setGenerating(false);
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                    <Calculator className="text-orange-500" />
                    Salary Generator
                </h1>
                <p className="text-gray-500 text-sm mt-1">Calculate and adjust variables like overtime hours, incentives, bonuses, and penalties before generating monthly salaries.</p>
            </div>

            <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <form onSubmit={handleGenerate} className="space-y-6">
                    {/* Period selection */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-gray-700 uppercase">Payroll Month:</label>
                            <select
                                value={date.month}
                                onChange={e => setDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            >
                                {months.map((m, idx) => (
                                    <option key={m} value={idx + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-gray-700 uppercase">Year:</label>
                            <input
                                type="number"
                                value={date.year}
                                onChange={e => setDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                className="w-28 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>
                        <Button type="button" onClick={fetchStaff} variant="secondary" className="bg-white border-gray-200 text-gray-700 ml-auto flex items-center gap-1.5 shadow-sm">
                            <RefreshCw size={16} /> Sync Profiles
                        </Button>
                    </div>

                    {loading ? (
                        <div className="py-12 flex justify-center"><Spinner /></div>
                    ) : staffList.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <ShieldAlert size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No active staff members found in users directory.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-4">Staff Details</th>
                                        <th className="p-4">Designation</th>
                                        <th className="p-4">Salary Type</th>
                                        <th className="p-4">Base Rate (₹)</th>
                                        <th className="p-4 w-32">Overtime (Hrs)</th>
                                        <th className="p-4 w-32">Bonus (₹)</th>
                                        <th className="p-4 w-32">Deductions (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {staffList.map(staff => {
                                        const override = overrides[staff.id] || { overtimeHours: 0, bonus: 0, deductions: 0 };
                                        return (
                                            <tr key={staff.id} className="hover:bg-gray-55/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900">{staff.fullName}</div>
                                                    <div className="text-xs text-gray-400 font-medium mt-0.5">ID #{staff.id} • {staff.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-semibold text-gray-700 block">{staff.designation || 'N/A'}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">{staff.department || 'Kitchen'}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-700 rounded-full">{staff.salaryType || 'Monthly Salary'}</span>
                                                </td>
                                                <td className="p-4 font-mono font-semibold">
                                                    ₹{(staff.salaryType === 'Daily Wage Salary' ? staff.dailyWage : staff.baseSalary) || '15,000'}
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={override.overtimeHours}
                                                        onChange={e => handleOverrideChange(staff.id, 'overtimeHours', e.target.value)}
                                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={override.bonus}
                                                        onChange={e => handleOverrideChange(staff.id, 'bonus', e.target.value)}
                                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-emerald-600"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={override.deductions}
                                                        onChange={e => handleOverrideChange(staff.id, 'deductions', e.target.value)}
                                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono text-rose-600"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Submit Section */}
                    {!loading && staffList.length > 0 && (
                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                            <Button type="submit" disabled={generating} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg border-0 hover:shadow-xl transition-all flex items-center gap-2">
                                {generating ? <Spinner size="sm" /> : <Calculator size={18} />}
                                {generating ? 'Calculating Payroll...' : 'Calculate & Generate Payroll'}
                            </Button>
                        </div>
                    )}
                </form>
            </Card>
        </div>
    );
};

export default SalaryGenerator;
