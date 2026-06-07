import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, TrendingDown, TrendingUp, MinusCircle, Info, Sparkles } from 'lucide-react';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';

const DailyUsage = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState([]);
    const [checkedPlans, setCheckedPlans] = useState({});
    const [analysis, setAnalysis] = useState([]);
    const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Usage Form State
    const [usageData, setUsageData] = useState({
        usageDate: new Date().toISOString().split('T')[0],
        mealType: 'Lunch',
        planId: null,
        menuItem: '',
        vegetableId: '',
        vegetableName: '',
        plannedQuantity: 0,
        actualUsedQuantity: 0,
        wastedQuantity: 0,
        remarks: '',
        markMealPrepared: true,
        deductStockFromInventory: true,
        wastageCannotBeReused: true,
        confirmUsageEntry: true,
        sendLowStockAlertAfterDeduction: true,
        
        // Custom requirements checkboxes
        prepared: true,
        partiallyPrepared: false,
        notPrepared: false,
        extraUsed: false,
        wastage: false
    });

    const fetchPlansForUsageDate = async () => {
        try {
            const res = await axiosClient.get(`/daily-usage/from-plan?date=${usageData.usageDate}`);
            const todayPlans = res.data.filter(p => p.mealType === usageData.mealType);
            setPlans(todayPlans);
        } catch (error) {
            console.error('Failed to load plans for usage date');
        }
    };

    const fetchAnalysis = async () => {
        try {
            const res = await axiosClient.get(`/daily-usage?date=${analysisDate}`);
            setAnalysis(res.data);
        } catch (error) {
            toast.error('Failed to load usage analysis.');
        }
    };

    useEffect(() => {
        fetchPlansForUsageDate();
    }, [usageData.usageDate, usageData.mealType]);

    useEffect(() => {
        const initial = {};
        plans.forEach(p => {
            const id = p.planId || p.id;
            initial[id] = {
                checked: true,
                actualUsedQuantity: p.requiredQuantity,
                wastedQuantity: 0,
                remarks: '',
                prepared: true,
                partiallyPrepared: false,
                notPrepared: false,
                extraUsed: false,
                wastage: false
            };
        });
        setCheckedPlans(initial);
    }, [plans]);

    useEffect(() => {
        fetchAnalysis();
    }, [analysisDate]);

    const handleUsageSubmit = async (e) => {
        e.preventDefault();
        
        const activeItems = Object.keys(checkedPlans)
            .filter(id => checkedPlans[id]?.checked)
            .map(id => {
                const plan = plans.find(p => (p.planId || p.id) === Number(id));
                const state = checkedPlans[id];
                return { plan, state };
            })
            .filter(item => item.plan !== undefined);

        if (activeItems.length === 0) {
            toast.warning('Please check at least one ingredient to record usage.');
            return;
        }

        try {
            await Promise.all(activeItems.map(({ plan, state }) => {
                const statusFlags = [];
                if (state.prepared) statusFlags.push("Prepared");
                if (state.partiallyPrepared) statusFlags.push("Partially Prepared");
                if (state.notPrepared) statusFlags.push("Not Prepared");
                if (state.extraUsed) statusFlags.push("Extra Used");
                if (state.wastage) statusFlags.push("Wastage");
                
                const combinedRemarks = `${statusFlags.join(', ')}. ${state.remarks}`.trim();

                const payload = {
                    planId: plan.planId || plan.id,
                    usageDate: usageData.usageDate,
                    mealType: usageData.mealType,
                    menuItem: plan.menuItem,
                    vegetableId: Number(plan.vegetableId || plan.ingredientId),
                    vegetableName: plan.vegetableName || plan.ingredientName,
                    plannedQuantity: Number(plan.requiredQuantity),
                    actualUsedQuantity: Number(state.actualUsedQuantity),
                    wastedQuantity: Number(state.wastedQuantity),
                    remarks: combinedRemarks,
                    markMealPrepared: usageData.markMealPrepared,
                    deductStockFromInventory: usageData.deductStockFromInventory,
                    wastageCannotBeReused: usageData.wastageCannotBeReused,
                    confirmUsageEntry: usageData.confirmUsageEntry,
                    sendLowStockAlertAfterDeduction: usageData.sendLowStockAlertAfterDeduction
                };

                return axiosClient.post('/daily-usage', payload);
            }));

            toast.success('Daily usages recorded successfully! Stock updated.');
            fetchAnalysis();
            fetchPlansForUsageDate();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to submit some daily usage records.');
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Properly Used': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'Under Used': return <TrendingDown size={16} className="text-blue-500" />;
            case 'Over Used': return <TrendingUp size={16} className="text-red-500" />;
            case 'Not Used': return <MinusCircle size={16} className="text-gray-400" />;
            default: return null;
        }
    };

    if (user?.role !== 'Admin' && user?.role !== 'Staff') {
        return <div className="p-8 text-center text-red-500">Access Denied</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800">Daily Ingredient Usage</h1>
                <p className="text-gray-500 text-sm mt-1">Record actual ingredient consumption and process stock deductions automatically</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-5 h-fit">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Record Usage</h2>
                    <form onSubmit={handleUsageSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Plan Date</label>
                                <input type="date" required value={usageData.usageDate} onChange={e => setUsageData({...usageData, usageDate: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Meal Type</label>
                                <select value={usageData.mealType} onChange={e => setUsageData({...usageData, mealType: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                                    <option value="Breakfast">Breakfast</option>
                                    <option value="Lunch">Lunch</option>
                                    <option value="Dinner">Dinner</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-gray-100 pt-3">
                            <label className="text-sm font-semibold text-gray-700">Select Planned Ingredients to Record</label>
                            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                                {plans.map(p => {
                                    const id = p.planId || p.id;
                                    const state = checkedPlans[id] || { checked: false, actualUsedQuantity: 0, wastedQuantity: 0, remarks: '', prepared: true, partiallyPrepared: false, notPrepared: false, extraUsed: false, wastage: false };

                                    return (
                                        <div key={id} className={`p-4 rounded-xl border transition-all ${
                                            state.checked 
                                                ? 'border-orange-200 bg-orange-50/10 shadow-sm' 
                                                : 'border-gray-150 bg-gray-50/30'
                                        }`}>
                                            <label className="flex items-center gap-2 font-semibold text-gray-800 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox"
                                                    checked={state.checked}
                                                    onChange={e => {
                                                        setCheckedPlans(prev => ({
                                                            ...prev,
                                                            [id]: { ...prev[id], checked: e.target.checked }
                                                        }));
                                                    }}
                                                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                                                />
                                                <span className="truncate">{p.ingredientName || p.vegetableName}</span>
                                                <span className="text-xs font-normal text-gray-400">({p.menuItem})</span>
                                            </label>

                                            {state.checked && (
                                                <div className="mt-3 space-y-3 pt-3 border-t border-gray-100 animate-fade-in">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <span className="text-xs text-gray-500 font-medium">Planned Qty</span>
                                                            <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                                {Number(p.requiredQuantity || 0).toFixed(2)} {p.unit}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-xs text-gray-500 font-medium">Actual Used</span>
                                                            <div className="flex items-center gap-1">
                                                                <input 
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    required
                                                                    value={state.actualUsedQuantity}
                                                                    onChange={e => {
                                                                        setCheckedPlans(prev => ({
                                                                            ...prev,
                                                                            [id]: { ...prev[id], actualUsedQuantity: e.target.value }
                                                                        }));
                                                                    }}
                                                                    className="w-full px-2.5 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-semibold text-right"
                                                                />
                                                                <span className="text-xs text-gray-400 w-6 font-medium">{p.unit}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <span className="text-xs text-gray-500 font-medium">Wasted Qty</span>
                                                            <div className="flex items-center gap-1">
                                                                <input 
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={state.wastedQuantity}
                                                                    onChange={e => {
                                                                        setCheckedPlans(prev => ({
                                                                            ...prev,
                                                                            [id]: { ...prev[id], wastedQuantity: e.target.value }
                                                                        }));
                                                                    }}
                                                                    className="w-full px-2.5 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-semibold text-right"
                                                                />
                                                                <span className="text-xs text-gray-400 w-6 font-medium">{p.unit}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-xs text-gray-500 font-medium">Remarks</span>
                                                            <input 
                                                                type="text"
                                                                placeholder="e.g. Good quality"
                                                                value={state.remarks}
                                                                onChange={e => {
                                                                    setCheckedPlans(prev => ({
                                                                        ...prev,
                                                                        [id]: { ...prev[id], remarks: e.target.value }
                                                                    }));
                                                                }}
                                                                className="w-full px-2.5 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={state.prepared} 
                                                                onChange={e => setCheckedPlans(prev => ({
                                                                    ...prev,
                                                                    [id]: { ...prev[id], prepared: e.target.checked }
                                                                }))} 
                                                                className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                                                            />
                                                            Prepared
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={state.partiallyPrepared} 
                                                                onChange={e => setCheckedPlans(prev => ({
                                                                    ...prev,
                                                                    [id]: { ...prev[id], partiallyPrepared: e.target.checked }
                                                                }))} 
                                                                className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                                                            />
                                                            Partial
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={state.notPrepared} 
                                                                onChange={e => setCheckedPlans(prev => ({
                                                                    ...prev,
                                                                    [id]: { ...prev[id], notPrepared: e.target.checked }
                                                                }))} 
                                                                className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                                                            />
                                                            Not Prep
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={state.extraUsed} 
                                                                onChange={e => setCheckedPlans(prev => ({
                                                                    ...prev,
                                                                    [id]: { ...prev[id], extraUsed: e.target.checked }
                                                                }))} 
                                                                className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                                                            />
                                                            Extra
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={state.wastage} 
                                                                onChange={e => setCheckedPlans(prev => ({
                                                                    ...prev,
                                                                    [id]: { ...prev[id], wastage: e.target.checked }
                                                                }))} 
                                                                className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                                                            />
                                                            Wastage
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {plans.length === 0 && (
                                    <div className="text-center py-6 text-gray-400 text-sm flex items-center justify-center gap-1.5 bg-gray-50/50 rounded-xl border border-dashed border-gray-150">
                                        <Info size={16} /> No plans recorded for this date/meal.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={usageData.deductStockFromInventory} onChange={e => setUsageData({...usageData, deductStockFromInventory: e.target.checked})} className="rounded text-orange-600 focus:ring-orange-500" />
                                Deduct stock from Inventory
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={usageData.confirmUsageEntry} onChange={e => setUsageData({...usageData, confirmUsageEntry: e.target.checked})} className="rounded text-orange-600 focus:ring-orange-500" />
                                Confirm usage entries match preparation logs
                            </label>
                        </div>

                        <button type="submit" disabled={plans.length === 0} className={`w-full py-2.5 text-white rounded-xl font-bold transition-all shadow-lg ${
                            plans.length === 0 
                                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                                : 'bg-green-600 hover:bg-green-700 shadow-green-500/10'
                        }`}>
                            Deduct Stock & Record Batch
                        </button>
                    </form>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-7">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Usage Analysis Logs</h2>
                        <input type="date" value={analysisDate} onChange={e => setAnalysisDate(e.target.value)} className="px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3">Meal Type</th>
                                    <th className="px-4 py-3">Dish Name</th>
                                    <th className="px-4 py-3">Ingredient</th>
                                    <th className="px-4 py-3 text-right">Planned Qty</th>
                                    <th className="px-4 py-3 text-right">Actual Used</th>
                                    <th className="px-4 py-3 text-right">Wasted Qty</th>
                                    <th className="px-4 py-3">Usage Status</th>
                                    <th className="px-4 py-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {analysis.map(a => (
                                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-gray-800">{a.mealType}</td>
                                        <td className="px-4 py-3 text-gray-600">{a.menuItem || 'N/A'}</td>
                                        <td className="px-4 py-3 font-bold text-gray-800">{a.vegetableName}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{a.plannedQuantity.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">{a.actualUsedQuantity.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-red-500">{a.wastedQuantity.toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(a.usageStatus)}
                                                <span className="text-xs font-semibold">{a.usageStatus}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={a.remarks}>{a.remarks || '-'}</td>
                                    </tr>
                                ))}
                                {analysis.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                            <Info size={36} className="mx-auto text-gray-300 mb-2" />
                                            No usage records found for this date.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyUsage;
