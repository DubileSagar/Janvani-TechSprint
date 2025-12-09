import { getIssueTypeById } from '../../constants/civicIssues';


import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dbService } from '../../api/db';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area, LineChart, Line, ComposedChart, Scatter
} from 'recharts';
import './AdminDashboard.css';

const AdminAnalytics = () => {
    const { user } = useOutletContext();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

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
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [user]);

    if (loading) return <div className="dashboard-loading">Loading Analytics...</div>;

    

    const normalize = (s) => (s || 'new').trim().toLowerCase();

    
    const statusCounts = { Resolved: 0, 'In Progress': 0, New: 0, Rejected: 0 };
    reports.forEach(r => {
        const s = normalize(r.status);
        if (s === 'resolved') statusCounts.Resolved++;
        else if (s === 'in progress' || s === 'in-progress') statusCounts['In Progress']++;
        else if (s === 'rejected') statusCounts.Rejected++;
        else statusCounts.New++;
    });

    const statusData = [
        { name: 'Resolved', value: statusCounts.Resolved, color: '#10b981' },
        { name: 'In Progress', value: statusCounts['In Progress'], color: '#f59e0b' },
        { name: 'New', value: statusCounts.New, color: '#3b82f6' },
        { name: 'Rejected', value: statusCounts.Rejected, color: '#ef4444' }
    ].filter(d => d.value > 0);

    
    const typeCounts = {};
    reports.forEach(r => {
        const typeObj = getIssueTypeById(r.issueTypeId);
        const t = typeObj ? typeObj.title : (r.issueType || 'General');
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const typeData = Object.entries(typeCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();



    const getDate = (r) => new Date(r.reportDate || r.$createdAt);

    const trendData = last7Days.map(date => {
        const newCount = reports.filter(r => getDate(r).toISOString().startsWith(date)).length;
        const resolvedCount = reports.filter(r =>
            normalize(r.status) === 'resolved' && r.$updatedAt.startsWith(date) 
        ).length;

        return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            New: newCount,
            Resolved: resolvedCount
        };
    });

    
    const now = new Date();
    const agingCounts = { '< 24h': 0, '1-3 Days': 0, '3-7 Days': 0, '> 7 Days': 0 };

    reports.filter(r => normalize(r.status) !== 'resolved' && normalize(r.status) !== 'rejected').forEach(r => {
        const created = getDate(r);
        const diffHours = (now - created) / (1000 * 60 * 60);

        if (diffHours < 24) agingCounts['< 24h']++;
        else if (diffHours < 72) agingCounts['1-3 Days']++;
        else if (diffHours < 168) agingCounts['3-7 Days']++;
        else agingCounts['> 7 Days']++;
    });

    const agingData = Object.entries(agingCounts).map(([name, value]) => ({ name, value }));

    
    let districtData = [];
    let efficiencyData = [];
    let criticalDistricts = [];

    if (user.role === 'SUPER_ADMIN') {
        const distMap = {};
        reports.forEach(r => {
            const d = r.district || 'Unknown';
            if (!distMap[d]) distMap[d] = { total: 0, resolved: 0, inProgress: 0, new: 0 };

            distMap[d].total++;
            const s = normalize(r.status);
            if (s === 'resolved') distMap[d].resolved++;
            else if (s === 'in progress' || s === 'in-progress') distMap[d].inProgress++;
            else distMap[d].new++;
        });

        
        districtData = Object.entries(distMap).map(([name, stats]) => ({
            name,
            rate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
            total: stats.total,
            resolved: stats.resolved,
            inProgress: stats.inProgress,
            new: stats.new
        })).sort((a, b) => b.rate - a.rate);

        
        efficiencyData = districtData.map(d => ({
            name: d.name,
            volume: d.total,
            efficiency: d.rate,
            backlog: d.new + d.inProgress
        })).sort((a, b) => b.volume - a.volume);

        
        criticalDistricts = districtData.filter(d => d.rate < 40 || d.new > 10);
    }

    
    const total = reports.length;
    const resolutionRate = total > 0 ? Math.round((statusCounts.Resolved / total) * 100) : 0;
    const estResponseTime = resolutionRate > 80 ? "18h" : resolutionRate > 50 ? "36h" : "52h";

    return (
        <div className="admin-dashboard">
            {}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Analytics Overview</h2>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                    {user.role === 'SUPER_ADMIN'
                        ? `State-wide analysis for ${user.state}`
                        : `District analysis for ${user.district}`}
                </p>
            </div>

            {}
            <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
                <div className="kpi-card">
                    <h3>Resolution Rate</h3>
                    <div className="value" style={{ color: resolutionRate > 70 ? '#10b981' : '#f59e0b' }}>
                        {resolutionRate}%
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {resolutionRate > 70 ? 'Above Target (70%)' : 'Below Target (70%)'}
                    </p>
                </div>
                <div className="kpi-card">
                    <h3>Avg. Response Time</h3>
                    <div className="value" style={{ color: '#3b82f6' }}>{estResponseTime}</div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Estimated based on activity</p>
                </div>
                <div className="kpi-card">
                    <h3>Backlog (&gt; 7 Days)</h3>
                    <div className="value" style={{ color: agingCounts['> 7 Days'] > 5 ? '#ef4444' : '#64748b' }}>
                        {agingCounts['> 7 Days']}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Old unresolved issues</p>
                </div>
                <div className="kpi-card">
                    <h3>Total Reports</h3>
                    <div className="value" style={{ color: '#1e293b' }}>{total}</div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>All time volume</p>
                </div>
            </div>

            {}
            <div className="analytics-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '1.5rem'
            }}>

                {}
                <div className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
                    <div className="section-header">
                        <h3>Incoming vs Resolved Volume (Last 7 Days)</h3>
                    </div>
                    <div className="section-content" style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="New" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {}
                {user.role === 'SUPER_ADMIN' && (
                    <>
                        {}
                        <div className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
                            <div className="section-header">
                                <h3>District Efficiency Matrix (Volume vs Resolution Rate)</h3>
                            </div>
                            <div className="section-content" style={{ height: '400px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={efficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" scale="band" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Volume', angle: -90, position: 'insideLeft' }} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" unit="%" label={{ value: 'Efficiency', angle: 90, position: 'insideRight' }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="volume" name="Total Reports" fill="#8884d8" barSize={20} />
                                        <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Resolution Rate (%)" stroke="#82ca9d" strokeWidth={3} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {}
                        <div className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
                            <div className="section-header">
                                <h3>District Status Composition</h3>
                            </div>
                            <div className="section-content" style={{ height: '400px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={districtData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#10b981" />
                                        <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#f59e0b" />
                                        <Bar dataKey="new" name="New / Open" stackId="a" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {}
                        {criticalDistricts.length > 0 && (
                            <div className="dashboard-section" style={{ gridColumn: '1 / -1', borderLeft: '4px solid #ef4444' }}>
                                <div className="section-header">
                                    <h3 style={{ color: '#ef4444' }}>⚠️ Districts Needing Attention</h3>
                                </div>
                                <div className="section-content">
                                    <div className="table-container">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>District</th>
                                                    <th>Resolution Rate</th>
                                                    <th>Backlog (Open Issues)</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {criticalDistricts.map(d => (
                                                    <tr key={d.name}>
                                                        <td>{d.name}</td>
                                                        <td style={{ color: d.rate < 40 ? '#ef4444' : 'inherit', fontWeight: 'bold' }}>{d.rate}%</td>
                                                        <td>{d.new + d.inProgress}</td>
                                                        <td>
                                                            <span className="status-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>
                                                                Critical
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3>Current Status Distribution</h3>
                    </div>
                    <div className="section-content" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="dashboard-section">
                    <div className="section-header">
                        <h3>Top 5 Issue Categories</h3>
                    </div>
                    <div className="section-content" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typeData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3>Backlog Aging (Open Issues)</h3>
                    </div>
                    <div className="section-content" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={agingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                                    {agingData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 3 ? '#ef4444' : '#f59e0b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminAnalytics;
