import React, { useEffect, useState } from 'react';
import { civicIssues, getIssueTypeById } from '../../constants/civicIssues';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { dbService } from '../../api/db';
import './AdminDashboard.css'; 

const AdminIssuesList = () => {
    const { user } = useOutletContext();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [loading, setLoading] = useState(true);

    
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [districtFilter, setDistrictFilter] = useState('All');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const allReports = await dbService.getReports(1000);
                let relevantReports = allReports;

                if (user.role === 'DISTRICT_ADMIN') {
                    relevantReports = allReports.filter(r =>
                        r.district?.toLowerCase() === user.district?.toLowerCase()
                    );
                } else if (user.role === 'SUPER_ADMIN' && user.state) {
                    relevantReports = allReports.filter(r =>
                        !r.state || r.state.toLowerCase() === user.state.toLowerCase()
                    );
                }

                setReports(relevantReports);
                setFilteredReports(relevantReports);
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [user]);

    useEffect(() => {
        let result = reports;

        
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.issueTitle?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q) ||
                r.issueType?.toLowerCase().includes(q)
            );
        }

        
        if (statusFilter !== 'All') {
            const normalize = (s) => (s || 'new').toLowerCase().trim();
            const target = normalize(statusFilter);

            result = result.filter(r => {
                const current = normalize(r.status);
                
                
                

                if (target === 'new') return ['new', 'pending', 'open'].includes(current);
                if (target === 'in progress') return current === 'in progress' || current === 'in-progress';
                return current === target;
            });
        }

        
        if (districtFilter !== 'All') {
            result = result.filter(r => r.district === districtFilter);
        }

        setFilteredReports(result);
    }, [search, statusFilter, districtFilter, reports]);

    
    const districts = [...new Set(reports.map(r => r.district).filter(Boolean))];

    if (loading) return <div className="dashboard-loading">Loading Issues...</div>;

    return (
        <div className="admin-dashboard">
            <div className="dashboard-section">
                <div className="section-header" style={{ display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>All Issues</h3>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{filteredReports.length} records found</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', minWidth: '250px' }}
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                        >
                            <option value="All">All Status</option>
                            <option value="New">New</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                        </select>

                        {user.role === 'SUPER_ADMIN' && (
                            <select
                                value={districtFilter}
                                onChange={(e) => setDistrictFilter(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                            >
                                <option value="All">All Districts</option>
                                {districts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="section-content">
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>District</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map(report => (
                                    <tr key={report.$id}>
                                        <td><span style={{ fontFamily: 'monospace', color: '#666' }}>{report.$id.substring(0, 8)}</span></td>
                                        <td>{report.issueTitle}</td>
                                        <td>{getIssueTypeById(report.issueTypeId)?.title || report.issueType || 'General'}</td>
                                        <td>{report.district || '-'}</td>
                                        <td>
                                            <span className={`status-badge status-${(report.status || 'new').toLowerCase().replace(' ', '-')}`}>
                                                {report.status || 'New'}
                                            </span>
                                        </td>
                                        <td>{new Date(report.$createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white' }}
                                                onClick={() => navigate(`/issue/${report.$id}`)}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReports.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                            No issues found matching your filters.
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

export default AdminIssuesList;
