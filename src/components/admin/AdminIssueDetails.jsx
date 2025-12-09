import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../api/db';
import '../IssueDetails.css'; 

const AdminIssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState(null);
    const [resolutionImageUrl, setResolutionImageUrl] = useState(null);
    const [updating, setUpdating] = useState(false);

    
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolutionFile, setResolutionFile] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const data = await dbService.getReport(id);
                
                if (typeof data.address === 'string') {
                    try {
                        data.address = JSON.parse(data.address);
                    } catch (e) { }
                }
                setReport(data);

                if (data.imageId) {
                    const url = dbService.getImageUrl(data.imageId);
                    setImageUrl(url);
                }

                if (data.resolutionImageId) {
                    const resUrl = dbService.getImageUrl(data.resolutionImageId);
                    setResolutionImageUrl(resUrl);
                }
            } catch (error) {
                console.error("Failed to fetch report", error);
                alert("Failed to load issue details.");
                navigate('/admin/issues');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchReport();
    }, [id, navigate]);

    const sendSmsNotification = async (reportData, status, note = '') => {
        console.log('🔍 SMS Debug - Full report data:', {
            id: reportData.$id,
            reporterPhone: reportData.reporterPhone,
            phone: reportData.phone,
            userPhone: reportData.userPhone,
            name: reportData.name,
            issueTitle: reportData.issueTitle
        });

        
        const phoneNumber = reportData.reporterPhone || reportData.phone || reportData.userPhone;

        if (!phoneNumber) {
            console.error('❌ No phone number found in report data!');
            alert(`Debug: No phone number found. Report data: ${JSON.stringify({
                reporterPhone: reportData.reporterPhone,
                phone: reportData.phone,
                userPhone: reportData.userPhone
            })}`);
            return;
        }

        console.log(`📱 Using phone number: ${phoneNumber}`);

        try {
            
            
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

            const statusUpper = status.toUpperCase();
            const noteText = note ? ` Note: ${note}` : '';

            
            
            const titleShort = reportData.issueTitle.length > 30 ? reportData.issueTitle.substring(0, 30) + '...' : reportData.issueTitle;

            const message = `Hello ${reportData.name || 'Citizen'}, your issue "${titleShort}" status has been updated to: ${statusUpper}. - जन Vani`;

            console.log(`📤 Sending SMS request to backend...`);
            const response = await fetch(`${API_BASE_URL}/api/send-sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phoneNumber,
                    message: message
                })
            });

            const result = await response.json();
            console.log("✅ SMS Response from server:", result);

            if (result.success) {
                alert(`SMS sent successfully to ${phoneNumber}!`);
            } else {
                alert(`SMS failed: ${result.error}`);
            }
        } catch (error) {
            console.error("❌ Failed to send SMS:", error);
            alert(`Debug: SMS Failed. Error: ${error.message}`);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (newStatus === 'Resolved') {
            setShowResolveModal(true);
            return;
        }

        if (!window.confirm(`Are you sure you want to mark this issue as ${newStatus}?`)) return;

        setUpdating(true);
        try {
            await dbService.updateReport(report.$id, { status: newStatus });
            setReport(prev => ({ ...prev, status: newStatus }));
            
            sendSmsNotification(report, newStatus);
            
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update status.");
        } finally {
            setUpdating(false);
        }
    };

    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        if (!resolutionFile) {
            alert("Please upload an image as proof of resolution.");
            return;
        }

        setUpdating(true);
        try {
            
            const fileRes = await dbService.uploadImage(resolutionFile);

            
            await dbService.updateReport(report.$id, {
                status: 'Resolved',
                resolutionImageId: fileRes.$id,
                resolutionNote: resolutionNote
            });

            setReport(prev => ({
                ...prev,
                status: 'Resolved',
                resolutionImageId: fileRes.$id,
                resolutionNote: resolutionNote
            }));

            
            setResolutionImageUrl(dbService.getImageUrl(fileRes.$id));
            setShowResolveModal(false);

            
            sendSmsNotification(report, 'Resolved', resolutionNote);



            
            if (report.reporterPhone) {
                const rewardSuccess = await dbService.addPointsToUser(report.reporterPhone, 50);
                if (rewardSuccess) alert("Issue resolved and User rewarded 50 points!");
                else alert("Issue resolved but failed to reward user (check logs).");
            } else {
                alert("Issue resolved! (User phone missing, no reward given)");
            }

        } catch (error) {
            console.error("Resolution error:", error);
            alert("Failed to resolve issue. Please try again.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="loading">Loading details...</div>;
    if (!report) return <div className="error">Report not found</div>;

    const currentStatus = (report.status || 'open').toLowerCase();

    
    let activeStep = 0;
    if (currentStatus === 'in progress' || currentStatus === 'in-progress') activeStep = 1;
    if (currentStatus === 'resolved') activeStep = 2;

    return (
        <div className="issue-details-page" style={{ paddingTop: '2rem', position: 'relative' }}>
            <div className="header-actions">
                <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
            </div>

            <div className="details-header">
                <h1>{report.issueTitle || 'Issue Details'}</h1>
                <span className={`status-badge ${report.status}`}>{report.status || 'open'}</span>
            </div>

            {}
            <div className="progress-container" style={{ marginBottom: '2rem' }}>
                <div className="progress-track">
                    {}
                    <div className={`progress-step ${activeStep >= 0 ? 'active' : ''} ${activeStep > 0 ? 'completed' : ''}`}>
                        <div className="step-icon">{activeStep > 0 ? '✓' : '1'}</div>
                        <div className="step-label">Raised</div>
                    </div>
                    <div className={`progress-line ${activeStep >= 1 ? 'active' : ''}`}></div>

                    {}
                    <div className={`progress-step ${activeStep >= 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
                        <div className="step-icon">{activeStep > 1 ? '✓' : '2'}</div>
                        <div className="step-label">In Progress</div>
                    </div>
                    <div className={`progress-line ${activeStep >= 2 ? 'active' : ''}`}></div>

                    {}
                    <div className={`progress-step ${activeStep >= 2 ? 'active' : ''}`}>
                        <div className="step-icon">3</div>
                        <div className="step-label">Resolved</div>
                    </div>
                </div>
            </div>

            {}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
                {activeStep === 0 && (
                    <button
                        className="withdraw-btn"
                        style={{ background: '#f59e0b', padding: '0.8rem 2rem', fontSize: '1rem' }}
                        onClick={() => handleStatusUpdate('In Progress')}
                        disabled={updating}
                    >
                        {updating ? 'Updating...' : '➡️ Mark In Progress'}
                    </button>
                )}

                {activeStep === 1 && (
                    <button
                        className="withdraw-btn"
                        style={{ background: '#10b981', padding: '0.8rem 2rem', fontSize: '1rem' }}
                        onClick={() => handleStatusUpdate('Resolved')}
                        disabled={updating}
                    >
                        {updating ? 'Processing...' : '✅ Mark Resolved'}
                    </button>
                )}

                {activeStep < 2 && (
                    <button
                        className="withdraw-btn"
                        style={{ background: '#ef4444', opacity: 0.8 }}
                        onClick={() => handleStatusUpdate('Rejected')}
                        disabled={updating}
                    >
                        Reject Issue
                    </button>
                )}
            </div>

            {}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {imageUrl && (
                    <div className="issue-image-container">
                        <h3>Initial Report</h3>
                        <img src={imageUrl} alt="Reported Issue" className="issue-image" />
                    </div>
                )}
                {resolutionImageUrl && (
                    <div className="issue-image-container">
                        <h3 style={{ color: '#10b981' }}>Resolution Proof</h3>
                        <img src={resolutionImageUrl} alt="Resolution Proof" className="issue-image" style={{ border: '2px solid #10b981' }} />
                        {report.resolutionNote && <p style={{ marginTop: '0.5rem', color: '#666' }}>"{report.resolutionNote}"</p>}
                    </div>
                )}
            </div>

            <div className="details-card">
                <h2>Details</h2>
                <div className="detail-row">
                    <span className="label">Description:</span>
                    <span className="value">{report.description || 'No description provided.'}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Location:</span>
                    <span className="value">
                        {report.address ? `${report.address.area || ''}, ${report.address.city || ''}` : 'Unknown Location'}
                    </span>
                </div>
                <div className="detail-row">
                    <span className="label">Coordinates:</span>
                    <span className="value">
                        {report.lat && !isNaN(report.lat) ? Number(report.lat).toFixed(6) : '-'}, {report.lng && !isNaN(report.lng) ? Number(report.lng).toFixed(6) : '-'}
                    </span>
                </div>
                <div className="detail-row">
                    <span className="label">Reported By:</span>
                    <span className="value">{report.name || 'Anonymous'}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{new Date(report.$createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                    <span className="label">District:</span>
                    <span className="value">{report.district || 'N/A'}</span>
                </div>
            </div>

            {}
            <div className="details-card" style={{ marginTop: '2rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Surveillance Feed</h2>
                        <p style={{ color: '#666', marginBottom: 0 }}>View live camera feeds near this location (if available).</p>
                    </div>
                    <button
                        onClick={() => alert(`Opening surveillance feed for location: ${report.lat}, ${report.lng} (Mock)`)}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: '500'
                        }}
                    >
                        <span>📹</span> View Surveillance
                    </button>
                </div>
            </div>

            {}
            {showResolveModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
                        <h2 style={{ marginTop: 0 }}>Resolve Issue</h2>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Please upload an image as proof of resolution.</p>

                        <form onSubmit={handleResolveSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Proof Image *</label>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(e) => setResolutionFile(e.target.files[0])}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Resolution Note (Optional)</label>
                                <textarea
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                    rows="3"
                                    placeholder="Describe the work done..."
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowResolveModal(false)}
                                    style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    {updating ? 'Uploading...' : 'Complete Resolution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminIssueDetails;
