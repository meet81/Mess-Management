import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Dashboard Pages
import Home from '../pages/dashboard/Home';
import Menu from '../pages/dashboard/Menu';
import Attendance from '../pages/dashboard/Attendance';
import Payments from '../pages/dashboard/Payments';
import Feedback from '../pages/dashboard/Feedback';
import Leave from '../pages/dashboard/Leave';
import Users from '../pages/dashboard/Users';
import Inventory from '../pages/dashboard/Inventory';
import DailyUsage from '../pages/dashboard/DailyUsage';
import VendorOrderSuggestions from '../pages/dashboard/VendorOrderSuggestions';
import VendorOrders from '../pages/dashboard/VendorOrders';
import Vendors from '../pages/dashboard/Vendors';

// New Pages
import PayrollDashboard from '../pages/dashboard/PayrollDashboard';
import SalaryGenerator from '../pages/dashboard/SalaryGenerator';
import SalaryReports from '../pages/dashboard/SalaryReports';
import SystemSettings from '../pages/dashboard/SystemSettings';
import QrScanner from '../pages/dashboard/QrScanner';
import QrAttendanceDashboard from '../pages/dashboard/QrAttendanceDashboard';
import DigitalIdCard from '../pages/dashboard/DigitalIdCard';
import SalaryDetails from '../pages/dashboard/SalaryDetails';
import SalaryHistory from '../pages/dashboard/SalaryHistory';
import OvertimeManagement from '../pages/dashboard/OvertimeManagement';
import SalaryAdvanceManagement from '../pages/dashboard/SalaryAdvanceManagement';
import RoleManagement from '../pages/dashboard/RoleManagement';
import { hasPermission } from '../utils/permissions';

// Protected Route Wrapper
const ProtectedRoute = ({ children, module, action = 'View' }) => {
    const { user, permissionsLoading } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (permissionsLoading) return null;
    if (module && !hasPermission(user, module, action)) return <Navigate to="/dashboard" replace />;
    return children;
};

const PermissionRoute = ({ module, action = 'View', children }) => (
    <ProtectedRoute module={module} action={action}>{children}</ProtectedRoute>
);

const AppRouter = () => {
    return (
        <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Dashboard Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<PermissionRoute module="Dashboard"><Home /></PermissionRoute>} />
                <Route path="menu" element={<PermissionRoute module="Menu"><Menu /></PermissionRoute>} />
                <Route path="attendance" element={<PermissionRoute module="Attendance"><Attendance /></PermissionRoute>} />
                <Route path="payments" element={<PermissionRoute module="Payments"><Payments /></PermissionRoute>} />
                <Route path="feedback" element={<PermissionRoute module="Feedback"><Feedback /></PermissionRoute>} />
                <Route path="leave" element={<PermissionRoute module="Leave"><Leave /></PermissionRoute>} />
                <Route path="users" element={<PermissionRoute module="Users"><Users /></PermissionRoute>} />
                <Route path="roles" element={<PermissionRoute module="Roles"><RoleManagement /></PermissionRoute>} />
                <Route path="inventory" element={<PermissionRoute module="Inventory"><Inventory /></PermissionRoute>} />
                <Route path="inventory/usage" element={<PermissionRoute module="DailyUsage"><DailyUsage /></PermissionRoute>} />
                <Route path="inventory/suggestions" element={<PermissionRoute module="OrderSuggestions"><VendorOrderSuggestions /></PermissionRoute>} />
                <Route path="inventory/vendor-orders" element={<PermissionRoute module="VendorOrders"><VendorOrders /></PermissionRoute>} />
                <Route path="inventory/vendors" element={<PermissionRoute module="Vendors"><Vendors /></PermissionRoute>} />

                {/* Staff Salary routes */}
                <Route path="payroll" element={<PermissionRoute module="Payroll"><PayrollDashboard /></PermissionRoute>} />
                <Route path="payroll/generator" element={<PermissionRoute module="Payroll" action="Create"><SalaryGenerator /></PermissionRoute>} />
                <Route path="payroll/reports" element={<PermissionRoute module="Payroll" action="Export"><SalaryReports /></PermissionRoute>} />
                <Route path="payroll/details/:id" element={<PermissionRoute module="Payroll"><SalaryDetails /></PermissionRoute>} />
                <Route path="payroll/history" element={<PermissionRoute module="Payroll"><SalaryHistory /></PermissionRoute>} />

                {/* Overtime and Advances routes */}
                <Route path="overtime" element={<PermissionRoute module="Payroll" action="Create"><OvertimeManagement /></PermissionRoute>} />
                <Route path="advances" element={<PermissionRoute module="Payroll" action="Create"><SalaryAdvanceManagement /></PermissionRoute>} />

                {/* System Settings routes */}
                <Route path="settings" element={<PermissionRoute module="SystemSettings"><SystemSettings /></PermissionRoute>} />

                {/* QR Attendance routes */}
                <Route path="qr-scanner" element={<PermissionRoute module="QrAttendance" action="Create"><QrScanner /></PermissionRoute>} />
                <Route path="qr-dashboard" element={<PermissionRoute module="QrAttendance"><QrAttendanceDashboard /></PermissionRoute>} />
                <Route path="digital-id" element={<PermissionRoute module="DigitalId"><DigitalIdCard /></PermissionRoute>} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );

};

export default AppRouter;
