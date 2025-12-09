import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/janvani-logo-v5.svg';
import './AdminLayout.css';

const AdminLayout = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const storedUser = localStorage.getItem('cc_admin_user');
        if (!storedUser) {
            navigate('/login', { replace: true });
            return;
        }
        try {
            setUser(JSON.parse(storedUser));
        } catch (e) {
            console.error("Invalid user session", e);
            localStorage.removeItem('cc_admin_user');
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('cc_admin_user');
        navigate('/login', { replace: true });
    };

    if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Checking session...</div>;

    return (
        <div className="admin-layout">
            {}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="JanVani" className="sidebar-logo" />
                    <div className="sidebar-brand">
                        <span className="brand-name">जनvani</span>
                        <span className="brand-role">Admin Portal</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="icon">📊</span>
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/issues"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="icon">📋</span>
                        Issues List
                    </NavLink>

                    <NavLink
                        to="/analytics"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="icon">📈</span>
                        Analytics
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user.name.charAt(0)}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user.name}</span>
                            <span className="user-role">{user.role === 'SUPER_ADMIN' ? 'State Admin' : 'District Admin'}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </aside>

            {}
            <main className="admin-main">
                <header className="admin-header">
                    <h2 className="page-title">
                        {location.pathname.includes('dashboard') && 'Dashboard'}
                        {location.pathname.includes('issues') && 'Issue Management'}
                        {location.pathname.includes('analytics') && 'Analytics & Reports'}
                    </h2>
                    <div className="header-context">
                        <span className="context-badge state-badge">
                            {user.state}
                        </span>
                        {user.district && (
                            <span className="context-badge district-badge">
                                {user.district}
                            </span>
                        )}
                    </div>
                </header>

                <div className="admin-content">
                    <Outlet context={{ user }} />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
