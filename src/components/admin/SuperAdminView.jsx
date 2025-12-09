import React from 'react';
import AdminMap from './AdminMap';
import DistrictTable from './DistrictTable';

const SuperAdminView = ({ reports, user }) => {
    return (
        <>
            <div className="dashboard-section map-section">
                <div className="section-header">
                    <h3>State-wide Issue Map ({user.state})</h3>
                </div>
                <div className="map-container">
                    <AdminMap reports={reports} />
                </div>
            </div>

            <div className="dashboard-section">
                <div className="section-header">
                    <h3>District Performance</h3>
                </div>
                <div className="section-content">
                    <DistrictTable reports={reports} state={user.state} />
                </div>
            </div>
        </>
    );
};

export default SuperAdminView;
