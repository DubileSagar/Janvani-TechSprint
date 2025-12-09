import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { dbService } from '../api/db';
import { supabase } from '../supabase';
import './RedeemPoints.css';

const RedeemPoints = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(location.state?.user || null);
    const [loading, setLoading] = useState(!location.state?.user);

    const offers = [
        { id: 1, title: 'IRCTC Voucher', description: 'Get ₹50 off on your next train ticket booking via IRCTC.', points: 500, code: 'IRCTC50PROMO' },
        { id: 2, title: 'Electricity Bill', description: 'Instant ₹100 discount on your electricity bill payment.', points: 1000, code: 'POWER100OFF' },
        { id: 3, title: 'City Bus Pass', description: 'One day unlimited travel pass for city bus services.', points: 200, code: 'BUSFREE24' },
        { id: 4, title: 'BookMyShow', description: 'Flat 30% off on movie tickets (Max ₹150).', points: 300, code: 'MOVIE30JAN' },
        { id: 5, title: 'BSNL Data Pack', description: '1GB High Speed Data Booster Pack (Valid 24hrs).', points: 150, code: 'DATA1GBFREE' },
        { id: 6, title: 'Tax Rebate', description: 'Get ₹500 rebate on annual municipal property tax.', points: 5000, code: 'TAXREBATE5K' },
    ];

    useEffect(() => {
        if (user) {
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) { navigate('/'); return; }

                if (authUser.phone) {
                    const dbUser = await dbService.getUserByPhone(authUser.phone);
                    setUser(dbUser || authUser);
                } else {
                    setUser(authUser);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate, user]);

    if (loading) return <div className="loading-screen">Loading Offers...</div>;

    return (
        <div className="redeem-page">
            <div className="redeem-container">
                <div className="redeem-header">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                    </button>
                    <h1>Redeem Rewards</h1>
                </div>

                <div className="balance-card">
                    <div className="balance-info">
                        <div className="balance-label">Available Balance</div>
                        <div className="balance-amount">{user?.points || 0} pts</div>
                    </div>
                    <div style={{ textAlign: 'right', zIndex: 2 }}>
                        <div style={{ fontSize: '1rem', opacity: 0.8 }}>Start redeeming for real benefits!</div>
                    </div>
                </div>

                <div className="offers-grid">
                    {offers.map(offer => (
                        <OfferCard
                            key={offer.id}
                            offer={offer}
                            userPoints={user?.points || 0}
                            userPhone={user?.phone}
                            onRedeem={(pts) => setUser(prev => ({ ...prev, points: prev.points - pts }))}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const OfferCard = ({ offer, userPoints, userPhone, onRedeem }) => {
    const [swiped, setSwiped] = useState(false);
    const [coupon, setCoupon] = useState('');
    const [error, setError] = useState('');
    const [dragging, setDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [offset, setOffset] = useState(0);

    const isAffordable = userPoints >= offer.points;
    const maxSlide = 240; 

    const handleStart = (clientX) => {
        if (!isAffordable || swiped) return;
        setDragging(true);
        setStartX(clientX);
    };

    const handleMove = (clientX) => {
        if (!dragging) return;
        const diff = clientX - startX;
        if (diff < 0) setOffset(0);
        else if (diff > maxSlide) setOffset(maxSlide);
        else setOffset(diff);
    };

    const handleEnd = async () => {
        if (!dragging) return;
        setDragging(false);
        if (offset > maxSlide * 0.75) {
            setOffset(maxSlide);
            await processRedemption();
        } else {
            setOffset(0);
        }
    };

    const processRedemption = async () => {
        try {
            const result = await dbService.deductPointsFromUser(userPhone, offer.points);
            if (result.success) {
                setSwiped(true);
                setCoupon(offer.code);
                onRedeem(offer.points);
            } else {
                setError(result.error || 'Failed to redeem');
                setOffset(0);
            }
        } catch (e) {
            setError('Error occurred');
            setOffset(0);
        }
    };

    return (
        <div className={`offer-card ${!isAffordable ? 'disabled' : ''}`}>
            <div className="offer-top">
                <span className={`offer-cost ${!isAffordable ? 'locked' : ''}`}>
                    {offer.points} pts
                </span>
                <h3 className="offer-brand">{offer.title}</h3>
                <p className="offer-desc">{offer.description}</p>
            </div>

            <div className="offer-bottom">
                {swiped ? (
                    <div className="coupon-reveal">
                        <div className="coupon-label">Coupon Code</div>
                        <div className="coupon-code">{coupon}</div>
                    </div>
                ) : (
                    <div
                        className="swipe-container"
                        style={{ opacity: isAffordable ? 1 : 0.6, cursor: isAffordable ? 'pointer' : 'not-allowed' }}
                        onMouseLeave={() => { if (dragging) handleEnd() }}
                        onMouseUp={handleEnd}
                        onMouseMove={(e) => handleMove(e.clientX)}
                        onTouchEnd={handleEnd}
                        onTouchMove={(e) => handleMove(e.targetTouches[0].clientX)}
                    >
                        <div
                            className="swipe-track"
                            style={{ width: `${(offset / maxSlide) * 100}%` }}
                        />
                        <div className="swipe-text">
                            {isAffordable ? 'Swipe to Redeem' : `Need ${offer.points - userPoints} more`}
                        </div>

                        <div
                            className={`swipe-knob ${offset > 10 ? 'active' : ''}`}
                            style={{ transform: `translateX(${offset}px)` }}
                            onMouseDown={(e) => handleStart(e.clientX)}
                            onTouchStart={(e) => handleStart(e.targetTouches[0].clientX)}
                        >
                            {offset > maxSlide * 0.8 ? '✓' : '→'}
                        </div>
                    </div>
                )}
                {error && <div className="error-msg" style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>{error}</div>}
            </div>
        </div>
    );
};

export default RedeemPoints;
