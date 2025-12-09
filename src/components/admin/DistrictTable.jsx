import React from 'react';

const DistrictTable = ({ reports, state }) => {
    
    const districtsAP = ['Guntur', 'Visakhapatnam', 'Kurnool', 'Tirupati', 'Anantapur'];
    const districtsJH = ['Dhanbad', 'Ranchi', 'Jamshedpur', 'Bokaro', 'Hazaribagh'];

    const districts = state === 'Andhra Pradesh' ? districtsAP : districtsJH;

    
    const districtStats = districts.map(d => {
        const districtReports = reports.filter(r => r.district?.toLowerCase() === d.toLowerCase());
        const total = districtReports.length;
        const resolved = districtReports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;
        const pending = districtReports.filter(r => !r.status || ['new', 'pending', 'open'].includes(r.status.toLowerCase())).length;
        const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        return {
            name: d,
            total,
            resolved,
            pending,
            rate
        };
    });

    
    districtStats.sort((a, b) => a.rate - b.rate);

    return (
        <div className="table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>District</th>
                        <th>Total Issues</th>
                        <th>Resolved</th>
                        <th>Pending</th>
                        <th>Resolution Rate</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {districtStats.map(d => (
                        <tr key={d.name}>
                            <td>{d.name}</td>
                            <td>{d.total}</td>
                            <td>{d.resolved}</td>
                            <td>{d.pending}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '6px',
                                        backgroundColor: '#e2e8f0',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${d.rate}%`,
                                            height: '100%',
                                            backgroundColor: d.rate > 70 ? '#10b981' : d.rate > 40 ? '#f59e0b' : '#ef4444'
                                        }} />
                                    </div>
                                    <span>{d.rate}%</span>
                                </div>
                            </td>
                            <td>
                                {d.rate > 70 ? (
                                    <span className="performance-good">Excellent</span>
                                ) : d.rate < 40 ? (
                                    <span className="performance-bad">Needs Attention</span>
                                ) : (
                                    <span>Average</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DistrictTable;
