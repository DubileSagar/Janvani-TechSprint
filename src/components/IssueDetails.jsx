import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../api/db';
import './IssueDetails.css';

import { useLanguage } from '../context/LanguageContext';

const IssueDetails = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState(null);
    const [resolutionImageUrl, setResolutionImageUrl] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userUpvotes, setUserUpvotes] = useState([]);
    const [userDownvotes, setUserDownvotes] = useState([]);

    
    const userPhone = localStorage.getItem('cc_user_phone');
    const isMine = report && report.reporterPhone === userPhone;

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
                navigate('/issues');
            } finally {
                setLoading(false);
            }
        };

        const loadVotes = () => {
            try {
                const up = localStorage.getItem('cc_user_upvotes');
                if (up) setUserUpvotes(JSON.parse(up));
                const down = localStorage.getItem('cc_user_downvotes');
                if (down) setUserDownvotes(JSON.parse(down));
            } catch (e) { }
        };

        if (id) {
            fetchReport();
            loadVotes();
        }
    }, [id, navigate]);

    const handleVote = async (type) => { 
        if (!report) return;
        const isUp = type === 'up';
        const isDown = type === 'down';

        if ((isUp && userUpvotes.includes(report.$id)) || (isDown && userDownvotes.includes(report.$id))) {
            return; 
        }

        
        const originalUpvotes = report.upvotes || 0;
        const originalDownvotes = report.downvotes || 0;
        let newUpvotes = originalUpvotes;
        let newDownvotes = originalDownvotes;

        if (isUp) {
            newUpvotes++;
            
            if (userDownvotes.includes(report.$id)) {
                newDownvotes = Math.max(0, newDownvotes - 1);
            }

            setReport(prev => ({ ...prev, upvotes: newUpvotes, downvotes: newDownvotes }));
            setUserUpvotes(prev => [...prev, report.$id]);
            setUserDownvotes(prev => prev.filter(id => id !== report.$id));
        } else {
            newDownvotes++;
            
            if (userUpvotes.includes(report.$id)) {
                newUpvotes = Math.max(0, newUpvotes - 1);
            }

            setReport(prev => ({ ...prev, downvotes: newDownvotes, upvotes: newUpvotes }));
            setUserDownvotes(prev => [...prev, report.$id]);
            setUserUpvotes(prev => prev.filter(id => id !== report.$id));
        }

        try {
            await dbService.updateReport(report.$id, {
                upvotes: newUpvotes,
                downvotes: newDownvotes
            });

            
            
            let newUpIds = userUpvotes.filter(id => id !== report.$id); 
            if (isUp) newUpIds.push(report.$id);
            localStorage.setItem('cc_user_upvotes', JSON.stringify(newUpIds));

            
            let newDownIds = userDownvotes.filter(id => id !== report.$id); 
            if (isDown) newDownIds.push(report.$id);
            localStorage.setItem('cc_user_downvotes', JSON.stringify(newDownIds));

        } catch (error) {
            console.error("Vote failed", error);
            
            setReport(prev => ({ ...prev, upvotes: originalUpvotes, downvotes: originalDownvotes }));
            
            if (isUp) {
                setUserUpvotes(prev => prev.filter(id => id !== report.$id));
                if (userDownvotes.includes(report.$id)) {  }
            }
            else {
                setUserDownvotes(prev => prev.filter(id => id !== report.$id));
            }
        }
    };

    const handleWithdrawClick = () => {
        setShowConfirmModal(true);
    };

    const confirmWithdraw = async () => {
        try {
            await dbService.deleteReport(report.$id);
            alert("Report withdrawn successfully.");
            navigate('/issues');
        } catch (error) {
            console.error("Withdraw failed", error);
            alert("Failed to withdraw report.");
        }
    };

    if (loading) return <div className="loading">{t('loading')}</div>;
    if (!report) return <div className="error">{t('no_reports')}</div>;

    const currentStatus = (report.status || 'open').toLowerCase();
    let activeStep = 0;
    if (currentStatus === 'in progress' || currentStatus === 'in-progress') activeStep = 1;
    if (currentStatus === 'resolved') activeStep = 2;

    return (
        <div className="issue-details-page">
            <div className="header-actions">
                <button className="back-btn" onClick={() => navigate(-1)}>← {t('back_btn')}</button>
                {isMine && (
                    <button className="withdraw-btn" onClick={handleWithdrawClick}>{t('withdraw_btn')}</button>
                )}
            </div>

            <div className="details-header">
                <h1>{report.issueTitle || t('issue_details_title')}</h1>
                <span className={`status-badge ${(report.status || '').toLowerCase().replace(' ', '-')}`}>
                    {(report.status || '').toLowerCase() === 'resolved' ? t('status_resolved') :
                        (report.status || '').toLowerCase().includes('progress') || report.status === 'wip' ? t('status_wip') : t('status_raised')}
                </span>
            </div>

            <div className="progress-container">
                <div className="progress-track">
                    <div className={`progress-step ${activeStep >= 0 ? 'active' : ''}`}>
                        <div className="step-icon">📝</div>
                        <div className="step-label">{t('status_raised')}</div>
                    </div>
                    <div className={`progress-line ${activeStep >= 1 ? 'active' : ''}`}></div>
                    <div className={`progress-step ${activeStep >= 1 ? 'active' : ''}`}>
                        <div className="step-icon">⚙️</div>
                        <div className="step-label">{t('status_wip')}</div>
                    </div>
                    <div className={`progress-line ${activeStep >= 2 ? 'active' : ''}`}></div>
                    <div className={`progress-step ${activeStep >= 2 ? 'active' : ''}`}>
                        <div className="step-icon">✅</div>
                        <div className="step-label">{t('status_resolved')}</div>
                    </div>
                </div>
            </div>

            <div className="media-gallery" style={{ display: 'grid', gridTemplateColumns: resolutionImageUrl ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {imageUrl && (
                    <div className="issue-image-container">
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>Original Issue</label>
                        <img src={imageUrl} alt="Reported Issue" className="issue-image" style={{ width: '100%', borderRadius: '8px' }} />
                    </div>
                )}

                {resolutionImageUrl && (
                    <div className="resolution-image-container">
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#10b981' }}>✅ Resolution Proof</label>
                        <img src={resolutionImageUrl} alt="Resolution Proof" className="issue-image" style={{ width: '100%', borderRadius: '8px', border: '2px solid #10b981' }} />
                        {report.resolutionNote && (
                            <p style={{ marginTop: '8px', fontStyle: 'italic', color: '#555', background: '#f0fdf4', padding: '8px', borderRadius: '4px' }}>
                                " {report.resolutionNote} "
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="details-card">
                <h2>{t('details_section_title')}</h2>
                <div className="detail-row">
                    <span className="label">{t('label_desc')}:</span>
                    <span className="value">{report.description || 'No description provided.'}</span>
                </div>
                <div className="detail-row">
                    <span className="label">{t('label_loc')}:</span>
                    <span className="value">
                        {report.address ? `${report.address.area || ''}, ${report.address.city || ''}` : 'Unknown Location'}
                    </span>
                </div>
                <div className="detail-row">
                    <span className="label">{t('label_coords')}:</span>
                    <span className="value">
                        {report.lat && !isNaN(report.lat) ? Number(report.lat).toFixed(6) : '-'}, {report.lng && !isNaN(report.lng) ? Number(report.lng).toFixed(6) : '-'}
                    </span>
                </div>
                <div className="detail-row">
                    <span className="label">{t('label_reporter')}:</span>
                    <span className="value">{report.name || 'Anonymous'}</span>
                </div>
                <div className="detail-row">
                    <span className="label">{t('label_date')}:</span>
                    <span className="value">{new Date(report.$createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                    <span className="label">{t('label_upvotes')}:</span>
                    <span className="value">
                        {report.upvotes || 0}
                        <button
                            className={`vote-btn up ${userUpvotes.includes(report.$id) ? 'active' : ''}`}
                            onClick={() => handleVote('up')}
                            disabled={userUpvotes.includes(report.$id)}
                            style={{ marginLeft: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: userUpvotes.includes(report.$id) ? '#dcfce7' : 'white' }}
                        >
                            👍 {t('issue_upvote')}
                        </button>
                        <button
                            className={`vote-btn down ${userDownvotes.includes(report.$id) ? 'active' : ''}`}
                            onClick={() => handleVote('down')}
                            disabled={userDownvotes.includes(report.$id)}
                            style={{ marginLeft: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: userDownvotes.includes(report.$id) ? '#fee2e2' : 'white' }}
                        >
                            👎 {t('issue_downvote')}
                        </button>
                    </span>
                </div>
            </div>

            {showConfirmModal && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal">
                        <h3>{t('modal_withdraw_title')}</h3>
                        <p>{t('modal_withdraw_confirm')}</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowConfirmModal(false)}>{t('btn_cancel')}</button>
                            <button className="confirm-btn" onClick={confirmWithdraw}>{t('btn_confirm_withdraw')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueDetails;
