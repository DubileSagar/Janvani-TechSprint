import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { dbService } from '../api/db';
import { supportedLocations } from '../data/states-cities';
import { detectAdministrativeArea } from '../api/gis';
import { getIssueTypeById } from '../constants/civicIssues';
import './Profile.css';
import { useLanguage } from '../context/LanguageContext';

const Profile = ({ currentUser }) => {
    const navigate = useNavigate();
    const { t, language, toggleLanguage, isHindi } = useLanguage();
    const [loading, setLoading] = useState(!currentUser);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(currentUser || null);
    const [isEditing, setIsEditing] = useState(false);

    const locationHook = useLocation(); // Imported from react-router-dom

    useEffect(() => {
        if (locationHook.state?.newUser) {
            console.log("Profile: New User detected, engaging onboarding mode.");
            setIsEditing(true);
            // Clear state so it doesn't persist on reload (optional, but good practice)
            window.history.replaceState({}, document.title)
            // Ideally use a toast here, for now alert or just the UI opening is enough
            // setTimeout(() => alert("Welcome! Please complete your profile to continue."), 500);
        }
    }, [locationHook]);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: '',
        gender: '',
        state: '',
        district: ''
    });

    const [availableDistricts, setAvailableDistricts] = useState([]);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [myReports, setMyReports] = useState([]);

    useEffect(() => {
        const init = async () => {
            try {
                let userData = currentUser;
                let meta = {};

                if (userData) {
                    meta = {
                        display_name: userData.name,
                        age: userData.age,
                        gender: userData.gender,
                        state: userData.state,
                        district: userData.district
                    };
                } else {
                    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
                    if (!fetchedUser) throw new Error("No user found");
                    userData = fetchedUser;
                    meta = fetchedUser.user_metadata || {};
                }

                setUser(userData);

                const initialState = meta.state || '';
                const initialDistrict = meta.district || '';

                setFormData({
                    name: meta.display_name || '',
                    phone: userData.phone || '',
                    age: meta.age || '',
                    gender: meta.gender || '',
                    state: initialState,
                    district: initialDistrict
                });

                if (initialState && supportedLocations[initialState]) {
                    setAvailableDistricts(Object.keys(supportedLocations[initialState]));
                }

                if (userData.phone) {
                    const dbUser = await dbService.getUserByPhone(userData.phone);
                    if (dbUser) {
                        setUser(prev => ({ ...prev, ...dbUser }));
                    }


                    const reports = await dbService.getReportsByUser(userData.phone);
                    setMyReports(reports || []);
                }
            } catch (e) {
                console.error("Failed to load profile", e);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [currentUser, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'state') {
            if (value && supportedLocations[value]) {
                setAvailableDistricts(Object.keys(supportedLocations[value]));
                setFormData(prev => ({ ...prev, state: value, district: '' }));
            } else {
                setAvailableDistricts([]);
                setFormData(prev => ({ ...prev, state: value, district: '' }));
            }
        }

        if (name === 'district') {
            setFormData(prev => ({ ...prev, district: value }));
        }
    };

    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {

                let gisDistrict = '';
                try {
                    const gisResult = await detectAdministrativeArea(latitude, longitude);
                    if (gisResult && gisResult.areaName) {
                        gisDistrict = gisResult.areaName;
                    }
                } catch (gisErr) {
                    console.warn("GIS detection failed", gisErr);
                }


                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                const resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                const data = await resp.json();

                if (data.status === 'OK' && data.results[0]) {
                    let detectedState = '';
                    let googleDistrict = '';

                    data.results[0].address_components.forEach(comp => {
                        if (comp.types.includes('administrative_area_level_1')) detectedState = comp.long_name;
                        if (comp.types.includes('administrative_area_level_2')) googleDistrict = comp.long_name;
                    });
                    if (!googleDistrict) {
                        data.results[0].address_components.forEach(comp => {
                            if (comp.types.includes('administrative_area_level_3')) googleDistrict = comp.long_name;
                        });
                    }

                    const stateMatch = Object.keys(supportedLocations).find(s => s.toLowerCase() === detectedState.toLowerCase());

                    if (stateMatch) {
                        setAvailableDistricts(Object.keys(supportedLocations[stateMatch]));
                        let districtToMatch = gisDistrict || googleDistrict;
                        let districtMatch = '';

                        if (districtToMatch) {
                            const cleanDetected = districtToMatch.replace(/ District$/i, '').trim();
                            districtMatch = Object.keys(supportedLocations[stateMatch]).find(d => {
                                const supported = d.toLowerCase();
                                const detected = cleanDetected.toLowerCase();
                                return supported === detected || detected === supported.replace(/ District$/i, '').toLowerCase() || detected.includes(supported) || supported.includes(detected);
                            });
                        }

                        if (districtMatch) {
                            setFormData(prev => ({ ...prev, state: stateMatch, district: districtMatch }));
                            alert(`Detected: ${stateMatch}, ${districtMatch}`);
                        } else {
                            setFormData(prev => ({ ...prev, state: stateMatch, district: '' }));
                            alert(`Detected State: ${stateMatch}. Could not match District.`);
                        }
                    } else {
                        alert(`State "${detectedState}" not supported.`);
                    }
                }
            } catch (e) {
                console.error("Geocoding failed", e);
                alert("Failed to detect location.");
            } finally {
                setDetectingLocation(false);
            }
        }, () => {
            alert("Failed to get location.");
            setDetectingLocation(false);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updates = {
                display_name: formData.name,
                age: formData.age,
                gender: formData.gender,
                state: formData.state,
                district: formData.district,
                isProfileComplete: true
            };

            const { error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;
            alert("Profile updated!");
            setIsEditing(false);
        } catch (e) {
            console.error("Update failed", e);
            alert("Failed: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-screen">Loading Dashboard...</div>;


    return (
        <div className="profile-page">
            <div className="dashboard-grid">

                { }
                <aside className="profile-sidebar">
                    <div className="profile-card">
                        <div className="profile-avatar">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <h2 className="profile-name">{formData.name || 'Citizen'}</h2>
                        <p className="profile-detail">{formData.phone}</p>
                        <p className="profile-detail">{formData.district ? `${formData.district}, ${formData.state}` : 'Location not set'}</p>
                        <div className="verified-badge">✓ KYC Verified</div>

                        <div style={{ marginTop: '2rem' }}>
                            {!isEditing && (
                                <button className="btn-secondary" onClick={() => setIsEditing(true)}>Edit Profile</button>
                            )}
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={toggleLanguage}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid #138808',
                                    background: isHindi ? '#fff3e0' : 'white',
                                    color: '#138808',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {isHindi ? 'English' : 'हिंदी'}
                            </button>
                        </div>
                    </div>
                </aside>

                { }
                <main className="profile-main">

                    {isEditing ? (
                        <div className="dashboard-card edit-form-card">
                            <div className="card-header-row">
                                <h2>Edit Profile</h2>
                                <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>{t('profile_name')}</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('profile_age')}</label>
                                        <input type="number" name="age" value={formData.age} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('profile_gender')}</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange}>
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="location-section">
                                    <div className="section-header">
                                        <label>Location</label>
                                        <button type="button" className="btn-detect" onClick={handleAutoDetect} disabled={detectingLocation}>
                                            {detectingLocation ? 'Detecting...' : '📍 Auto-Detect'}
                                        </button>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('profile_state')}</label>
                                            <select name="state" value={formData.state} onChange={handleChange} required>
                                                <option value="">Select State</option>
                                                {Object.keys(supportedLocations).map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>{t('profile_district')}</label>
                                            <select name="district" value={formData.district} onChange={handleChange} required disabled={!formData.state}>
                                                <option value="">Select District</option>
                                                {availableDistricts.map(dist => (
                                                    <option key={dist} value={dist}>{dist}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem' }}>
                                    <button type="submit" className="btn-primary" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <>
                            { }
                            <div className="dashboard-card wallet-widget">
                                <div className="card-header-row" style={{ borderBottomColor: 'rgba(255,255,255,0.2)' }}>
                                    <h2 style={{ color: 'white' }}>JanVani Wallet</h2>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>Active</span>
                                </div>
                                <div className="wallet-row">
                                    <div>
                                        <div style={{ fontSize: '3rem', fontWeight: '800' }}>{user?.points || 0}</div>
                                        <div style={{ opacity: 0.9 }}>Reward Points Balance</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{(user?.points || 0) / 10}</div>
                                        <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>Cash Value</div>
                                    </div>
                                </div>
                                <div className="wallet-actions">
                                    <button className="wallet-btn" onClick={() => navigate('/wallet')}>View History</button>
                                    <button className="wallet-btn" onClick={() => navigate('/certificate', { state: { user } })} style={{ background: 'white', color: '#138808' }}>Get Certificate</button>
                                </div>
                            </div>

                            { }
                            <div className="dashboard-card">
                                <div className="card-header-row">
                                    <h2>My Documents <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'normal' }}>(DigiLocker Linked)</span></h2>
                                    <a href="#" style={{ color: '#138808', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'none' }}>View All</a>
                                </div>
                                <div className="doc-grid">
                                    <div className="doc-item">
                                        <div className="doc-icon">🆔</div>
                                        <div className="doc-info">
                                            <h4>Aadhaar Card</h4>
                                            <span>Verified</span>
                                        </div>
                                        <div className="doc-status"></div>
                                    </div>
                                    <div className="doc-item">
                                        <div className="doc-icon">🚙</div>
                                        <div className="doc-info">
                                            <h4>Driving License</h4>
                                            <span>Verified</span>
                                        </div>
                                        <div className="doc-status"></div>
                                    </div>
                                    <div className="doc-item">
                                        <div className="doc-icon">🗳️</div>
                                        <div className="doc-info">
                                            <h4>Voter ID</h4>
                                            <span>Verified</span>
                                        </div>
                                        <div className="doc-status"></div>
                                    </div>
                                    <div className="doc-item" style={{ borderStyle: 'dashed', justifyContent: 'center' }}>
                                        <div style={{ color: '#666' }}>+ Add Document</div>
                                    </div>
                                </div>
                            </div>

                            { }
                            <div className="dashboard-card">
                                <div className="card-header-row">
                                    <h2>Recent Reports</h2>
                                    <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => navigate('/issues')}>View All</button>
                                </div>
                                {myReports.length > 0 ? (
                                    <div className="recent-reports-list">
                                        {myReports.slice(0, 3).map(report => {
                                            const issueType = getIssueTypeById(report.issueTypeId);
                                            return (
                                                <div key={report.$id} className="report-item-mini" onClick={() => navigate(`/issue/${report.$id}`)}>
                                                    <div className="report-mini-icon">
                                                        {issueType ? issueType.icon : '📢'}
                                                    </div>
                                                    <div className="report-mini-info">
                                                        <h4>{issueType ? issueType.title : (report.issueTypeId || 'Issue')}</h4>
                                                        <span>{new Date(report.$createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className={`report-status-badge status-${(report.status || 'open').toLowerCase()}`}>
                                                        {report.status || 'Open'}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#666' }}>
                                        <p>Your recent civic reports and their status will appear here.</p>
                                        <button onClick={() => navigate('/report')} style={{ marginTop: '1rem', color: '#138808', background: 'none', border: '1px solid #138808', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer' }}>File a New Report</button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Profile;
