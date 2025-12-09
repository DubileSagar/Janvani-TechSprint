import React from 'react';
import AdminMap from './AdminMap';

const DistrictAdminView = ({ reports, user }) => {
    return (
        <>
            <div className="dashboard-section map-section">
                <div className="section-header">
                    <h3>District Issue Map ({user.district})</h3>
                </div>
                <div className="map-container">
                    <AdminMap reports={reports} />
                </div>
            </div>

            <div className="dashboard-section">
                <div className="section-header">
                    <h3>Recent Issues</h3>
                </div>
                <div className="section-content">
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.slice(0, 10).map(report => (
                                    <tr key={report.$id}>
                                        <td>{report.issueTitle}</td>
                                        <td>{report.issueType || 'General'}</td>
                                        <td>
                                            <span className={`status-badge status-${(report.status || 'new').toLowerCase().replace(' ', '-')}`}>
                                                {report.status || 'New'}
                                            </span>
                                        </td>
                                        <td>{new Date(report.$createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {reports.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                            No issues found for this district.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DistrictAdminView;
