import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dbService } from '../../api/db';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from 'recharts';
import './CustomReport.css';
import logo from '../../assets/janvani-logo-v5.svg';
import { civicIssues } from '../../constants/civicIssues';

const CustomReport = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState([]);
    const [filters, setFilters] = useState(location.state?.filters || {});

    useEffect(() => {
        if (!location.state?.filters) {
            navigate('/dashboard');
            return;
        }
        fetchFilteredData();
    }, [location.state]);

    const normalizeDistrict = (d) => {
        if (!d) return 'Unknown';
        const str = d.toString().trim().toLowerCase();
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const getReportStatusId = (status) => {
        const s = (status || 'new').toLowerCase().trim();
        if (s === 'resolved') return 'resolved';
        if (s === 'in progress' || s === 'in-progress') return 'in-progress';
        if (s === 'rejected') return 'rejected';
        return 'new';
    };

    const getDate = (r) => new Date(r.reportDate || r.$createdAt);

    const fetchFilteredData = async () => {
        try {
            const allReports = await dbService.getReports(1000);

            
            const filtered = allReports.filter(r => {
                if (filters.districts && filters.districts.length > 0) {
                    const rDist = normalizeDistrict(r.district);
                    if (!filters.districts.includes(rDist)) return false;
                }
                if (filters.statuses && filters.statuses.length > 0) {
                    const statusId = getReportStatusId(r.status);
                    if (!filters.statuses.includes(statusId)) return false;
                }
                if (filters.types && filters.types.length > 0) {
                    let typeIdStr = r.issueTypeId ? r.issueTypeId.toString() : null;
                    const knownIds = civicIssues.map(i => i.id.toString());

                    if (typeIdStr && !knownIds.includes(typeIdStr)) {
                        typeIdStr = '17';
                    }

                    if (!typeIdStr) {
                        const match = civicIssues.find(i => i.title === r.issueTitle);
                        typeIdStr = match ? match.id.toString() : '17';
                    }

                    if (!filters.types.includes(typeIdStr)) return false;
                }
                return true;
            });

            setReportData(filtered);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    
    const total = reportData.length;
    const resolvedCount = reportData.filter(r => getReportStatusId(r.status) === 'resolved').length;
    const newCount = reportData.filter(r => getReportStatusId(r.status) === 'new').length;
    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

    const activeIssues = total - resolvedCount;
    const backlogRatio = resolvedCount > 0 ? (activeIssues / resolvedCount).toFixed(2) : activeIssues;

    const efficiencyScore = Math.min(100, Math.round(resolutionRate * 0.8 + (resolvedCount > 5 ? 20 : 0)));

    const now = new Date();
    const criticalCount = reportData.filter(r => {
        const s = getReportStatusId(r.status);
        const age = (now - getDate(r)) / (1000 * 60 * 60 * 24);
        return (s === 'new' || s === 'in-progress') && age > 3;
    }).length;

    
    const typeCounts = {};
    reportData.forEach(r => {
        const t = r.issueType || 'General';
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    let paretoData = Object.entries(typeCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    let cumulative = 0;
    paretoData = paretoData.map(item => {
        cumulative += item.value;
        return { ...item, cumulativePercentage: Math.round((cumulative / total) * 100) };
    });

    
    const districtStats = {};
    reportData.forEach(r => {
        const d = normalizeDistrict(r.district);
        if (!districtStats[d]) districtStats[d] = { total: 0, resolved: 0 };
        districtStats[d].total++;
        if (getReportStatusId(r.status) === 'resolved') districtStats[d].resolved++;
    });

    const districtComparisonData = Object.entries(districtStats).map(([name, stats]) => ({
        district: name,
        Efficiency: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
        Resolution: stats.resolved
    }));

    
    const categoryStats = {};
    reportData.forEach(r => {
        const t = r.issueType || 'General';
        if (!categoryStats[t]) categoryStats[t] = { total: 0, resolved: 0, ageSum: 0 };
        categoryStats[t].total++;
        if (getReportStatusId(r.status) === 'resolved') categoryStats[t].resolved++;
        categoryStats[t].ageSum += (now - getDate(r));
    });

    const categoryRadarData = Object.entries(categoryStats)
        .map(([name, stats]) => ({
            category: name,
            Efficiency: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
            Speed: Math.max(0, 100 - Math.round(((stats.ageSum / stats.total) / (1000 * 60 * 60 * 24)) * 5))
        }))
        .slice(0, 6);

    const isSingleDistrict = filters.districts && filters.districts.length === 1;

    
    const hourCounts = new Array(24).fill(0);
    reportData.forEach(r => {
        const hour = getDate(r).getHours();
        hourCounts[hour]++;
    });
    const peakTimeData = hourCounts.map((count, hour) => ({
        hour: `${hour}:00`,
        count
    }));

    
    const trendMap = {};
    reportData.forEach(r => {
        const date = getDate(r).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trendMap[date] = (trendMap[date] || 0) + 1;
    });
    const trendData = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

    const handleExportCSV = () => {
        const headers = ["ID", "Title", "Category", "Status", "District", "Date", "Description"];
        const rows = reportData.map(r => [
            r.$id, `"${r.issueTitle}"`, `"${r.issueType || 'General'}"`, r.status, r.district,
            getDate(r).toLocaleDateString(), `"${(r.description || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `janvani_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="custom-report-container">Generating Report...</div>;

    return (
        <div className="custom-report-container">
            <div className="report-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <img src={logo} alt="JanVani Logo" style={{ height: '60px' }} />
                    <div className="report-title">
                        <h1 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem 0', color: '#1e293b' }}>जनvani Insight Report</h1>
                        <div className="report-meta">
                            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
                <div className="report-actions">
                    <button className="btn-action" onClick={() => window.print()}>Print / Save PDF</button>
                    <button className="btn-action primary" onClick={handleExportCSV}>Download CSV</button>
                </div>
            </div>

            <div className="filter-summary">
                <div className="filter-chip">
                    <span>District:</span>
                    <strong>{filters.districts?.join(', ') || 'All Andhra Pradesh'}</strong>
                </div>
                <div className="filter-chip">
                    <span>Status:</span>
                    <strong>{filters.statuses?.map(s => s.toUpperCase()).join(', ') || 'All'}</strong>
                </div>
                <div className="filter-chip">
                    <span>Total Records:</span>
                    <strong>{total}</strong>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-label">Resolution Efficiency</div>
                    <div className="kpi-value">{resolutionRate}%</div>
                    <div className="kpi-sub">Target: 85%</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Volume</div>
                    <div className="kpi-value">{total}</div>
                    <div className="kpi-sub">{newCount} New / {activeIssues} Active</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Govt. Efficacy Score</div>
                    <div className="kpi-value">{efficiencyScore}/100</div>
                    <div className="kpi-sub">Based on speed & closure</div>
                </div>
                <div className="kpi-card alert">
                    <div className="kpi-label">Critical Backlog</div>
                    <div className="kpi-value">{criticalCount}</div>
                    <div className="kpi-sub">Issues &gt; 3 days old</div>
                </div>
            </div>

            <div className="charts-grid-2">
                <div className="chart-card">
                    <h3>Pareto Analysis: Key Issues</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" scale="band" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" unit="%" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="value" name="Volume" fill="#413ea0" barSize={20} />
                            <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name="Cumulative %" stroke="#ff7300" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {!isSingleDistrict && districtComparisonData.length > 1 && (
                    <div className="chart-card">
                        <h3>District Performance Benchmark</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={districtComparisonData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="district" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar name="Efficiency" dataKey="Efficiency" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Radar name="Resolution" dataKey="Resolution" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                <Legend />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {isSingleDistrict && categoryRadarData.length > 0 && (
                    <div className="chart-card">
                        <h3>Category Performance Radar</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryRadarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="category" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar name="Efficiency" dataKey="Efficiency" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Radar name="Speed" dataKey="Speed" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                <Legend />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="charts-grid-2">
                <div className="chart-card">
                    <h3>Issue Reporting Trends</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3>Peak Reporting Times (Heatmap)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={peakTimeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" name="Reports" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="report-data">
                <h3>Detailed Issue Log</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>District</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(report => (
                                <tr key={report.$id}>
                                    <td>{report.issueTitle}</td>
                                    <td>{report.issueType || 'General'}</td>
                                    <td>{report.district}</td>
                                    <td>
                                        <span style={{
                                            textTransform: 'capitalize',
                                            color: getReportStatusId(report.status) === 'resolved' ? '#10b981' :
                                                getReportStatusId(report.status) === 'rejected' ? '#ef4444' : '#f59e0b',
                                            fontWeight: 600
                                        }}>
                                            {report.status || 'New'}
                                        </span>
                                    </td>
                                    <td>{getDate(report).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomReport;
