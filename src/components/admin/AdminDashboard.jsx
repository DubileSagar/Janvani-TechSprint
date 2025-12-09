import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dbService } from '../../api/db';
import SuperAdminView from './SuperAdminView';
import DistrictAdminView from './DistrictAdminView';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useOutletContext();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        pending: 0,
        inProgress: 0
    });

    useEffect(() => {
        const fetchReports = async () => {
            try {
                
                const allReports = await dbService.getReports(1000);

                let filteredReports = allReports;

                
                if (user.role === 'DISTRICT_ADMIN') {
                    
                    
                    

                    
                    
                    
                    

                    filteredReports = allReports.filter(r => {
                        const userDistrict = user.district?.toLowerCase().trim();
                        const reportDistrict = r.district?.toLowerCase().trim();

                        
                        if (reportDistrict === userDistrict) return true;

                        
                        if (!reportDistrict && r.address) {
                            let addrStr = '';
                            if (typeof r.address === 'string') addrStr = r.address.toLowerCase();
                            else if (typeof r.address === 'object') addrStr = JSON.stringify(r.address).toLowerCase();

                            if (addrStr.includes(userDistrict)) return true;
                        }

                        return false;
                    });
                } else if (user.role === 'SUPER_ADMIN') {
                    
                    
                    if (user.state) {
                        filteredReports = allReports.filter(r =>
                            !r.state || r.state.toLowerCase() === user.state.toLowerCase()
                        );
                    }
                }

                setReports(filteredReports);
                calculateStats(filteredReports);
            } catch (error) {
                console.error("Error fetching admin reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [user]);

    const calculateStats = (data) => {
        const normalize = (s) => (s || 'new').toLowerCase().trim();

        
        const uniqueStatuses = [...new Set(data.map(r => r.status))];
        console.log('Unique Statuses found:', uniqueStatuses);
        console.log('Normalized Statuses:', uniqueStatuses.map(normalize));

        const s = {
            total: data.length,
            resolved: data.filter(r => normalize(r.status) === 'resolved').length,
            inProgress: data.filter(r => {
                const n = normalize(r.status);
                return n === 'in progress' || n === 'in-progress';
            }).length,
            pending: data.filter(r => ['new', 'pending', 'open'].includes(normalize(r.status))).length
        };
        setStats(s);
    };

    if (loading) {
        return <div className="dashboard-loading">Loading Dashboard Data...</div>;
    }

    return (
        <div className="admin-dashboard">
            {}
            <div className="kpi-grid">
                <div className="kpi-card total">
                    <h3>Total Issues</h3>
                    <div className="value">{stats.total}</div>
                </div>
                <div className="kpi-card resolved">
                    <h3>Resolved</h3>
                    <div className="value">{stats.resolved}</div>
                </div>
                <div className="kpi-card progress">
                    <h3>In Progress</h3>
                    <div className="value">{stats.inProgress}</div>
                </div>
                <div className="kpi-card pending">
                    <h3>Pending</h3>
                    <div className="value">{stats.pending}</div>
                </div>
            </div>

            {}
            {user.role === 'SUPER_ADMIN' ? (
                <SuperAdminView reports={reports} user={user} />
            ) : (
                <DistrictAdminView reports={reports} user={user} />
            )}
        </div>
    );
};

export default AdminDashboard;
