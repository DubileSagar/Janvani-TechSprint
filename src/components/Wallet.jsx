import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { dbService } from '../api/db';
import { useLanguage } from '../context/LanguageContext';
import './Profile.css'; 
import logo from '../assets/janvani-logo-v5.svg'; 

const Wallet = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    navigate('/');
                    return;
                }

                
                const userPromise = authUser.phone
                    ? dbService.getUserByPhone(authUser.phone)
                    : Promise.resolve(null);

                const reportsPromise = authUser.phone
                    ? dbService.getReportsByUser(authUser.phone)
                    : Promise.resolve([]);

                const [dbUser, reports] = await Promise.all([userPromise, reportsPromise]);

                
                let userData = { ...authUser };
                if (dbUser) {
                    userData = { ...userData, ...dbUser };
                }
                setUser(userData);

                
                const resolvedReports = reports.filter(r => r.status === 'Resolved');
                resolvedReports.sort((a, b) => new Date(b.$updatedAt) - new Date(a.$updatedAt));
                setHistory(resolvedReports);

            } catch (error) {
                console.error("Error loading wallet:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWalletData();
    }, [navigate]);

    if (loading) return <div className="loading-screen">Loading Wallet...</div>;

    return (
        <div className="profile-page"> {}
            <div className="profile-container">
                <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '2rem' }}>💰</span> JanVani Wallet
                </h1>

                {}
                <div className="wallet-card" style={{
                    background: 'linear-gradient(135deg, #138808 0%, #2ecc71 100%)',
                    borderRadius: '16px',
                    padding: '30px',
                    color: 'white',
                    marginBottom: '2rem',
                    boxShadow: '0 8px 16px rgba(19, 136, 8, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Available Balance</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1 }}>{user?.points || 0}</div>
                                <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: '5px' }}>Total Points</div>
                            </div>
                            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '12px', backdropFilter: 'blur(5px)' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>₹{((user?.points || 0) / 10).toFixed(2)}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Cash Value</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', fontSize: '0.9rem', opacity: 0.8, borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '10px' }}>
                            Conversion Rate: 10 Points = ₹1.00
                        </div>
                    </div>
                </div>


                <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/redeem', { state: { user } })}
                        style={{
                            background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '1.2rem 3rem',
                            borderRadius: '50px',
                            fontSize: '1.1rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(245, 124, 0, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            transition: 'all 0.3s ease',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}
                    >
                        <span style={{ fontSize: '1.4rem' }}>🎁</span> REDEEM POINTS
                    </button>


                </div>

                {}
                <div className="history-section">
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#333' }}>Reward History</h2>

                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: '12px', color: '#666' }}>
                            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No rewards yet.</p>
                            <p style={{ fontSize: '0.9rem' }}>Report issues and verify resolutions to earn points!</p>
                            <button onClick={() => navigate('/report')} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', background: '#138808', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                Report an Issue
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
                            {history.map((item, index) => (
                                <div key={item.$id} style={{
                                    padding: '1.2rem',
                                    borderBottom: index < history.length - 1 ? '1px solid #f0f0f0' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'background 0.2s'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                            Issue Resolved: "{item.issueTitle}"
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                            {new Date(item.$updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} • {new Date(item.$updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div style={{
                                        color: '#138808',
                                        fontWeight: '700',
                                        fontSize: '1.1rem',
                                        background: '#ecfdf5',
                                        padding: '4px 12px',
                                        borderRadius: '20px'
                                    }}>
                                        +50 Pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wallet;
