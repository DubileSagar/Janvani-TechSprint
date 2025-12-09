import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminIssuesList from './components/admin/AdminIssuesList';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminIssueDetails from './components/admin/AdminIssueDetails';
import CustomReport from './components/admin/CustomReport';
import './App.css'; 

function AdminApp() {
    return (
        <div className="page">
            <Routes>
                <Route path="/login" element={<AdminLogin />} />

                <Route path="/" element={<AdminLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="issues" element={<AdminIssuesList />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="custom-report" element={<CustomReport />} /> {}
                    <Route path="issue/:id" element={<AdminIssueDetails />} />
                </Route>

                {}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default AdminApp;
