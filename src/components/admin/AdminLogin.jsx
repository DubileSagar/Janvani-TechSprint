import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/janvani-logo-v5.svg';
import './AdminLogin.css';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    
    const CREDENTIALS = {
        
        'ap.cm@crowdcivic.gov.in': { pass: 'ApCm@1234', role: 'SUPER_ADMIN', state: 'Andhra Pradesh', name: 'Hon. Chief Minister' },
        'jh.cm@crowdcivic.gov.in': { pass: 'JhCm@1234', role: 'SUPER_ADMIN', state: 'Jharkhand', name: 'Hon. Chief Minister' },

        
        'ap.guntur.admin@crowdcivic.gov.in': { pass: 'Guntur@123', role: 'DISTRICT_ADMIN', state: 'Andhra Pradesh', district: 'Guntur', name: 'District Admin - Guntur' },
        'ap.visakhapatnam.admin@crowdcivic.gov.in': { pass: 'Vizag@123', role: 'DISTRICT_ADMIN', state: 'Andhra Pradesh', district: 'Visakhapatnam', name: 'District Admin - Visakhapatnam' },
        'ap.kurnool.admin@crowdcivic.gov.in': { pass: 'Kurnool@123', role: 'DISTRICT_ADMIN', state: 'Andhra Pradesh', district: 'Kurnool', name: 'District Admin - Kurnool' },
        'ap.tirupati.admin@crowdcivic.gov.in': { pass: 'Tirupati@123', role: 'DISTRICT_ADMIN', state: 'Andhra Pradesh', district: 'Tirupati', name: 'District Admin - Tirupati' },
        'ap.anantapur.admin@crowdcivic.gov.in': { pass: 'Anantapur@123', role: 'DISTRICT_ADMIN', state: 'Andhra Pradesh', district: 'Anantapur', name: 'District Admin - Anantapur' },

        
        'jh.dhanbad.admin@crowdcivic.gov.in': { pass: 'Dhanbad@123', role: 'DISTRICT_ADMIN', state: 'Jharkhand', district: 'Dhanbad', name: 'District Admin - Dhanbad' },
        'jh.ranchi.admin@crowdcivic.gov.in': { pass: 'Ranchi@123', role: 'DISTRICT_ADMIN', state: 'Jharkhand', district: 'Ranchi', name: 'District Admin - Ranchi' },
        'jh.jamshedpur.admin@crowdcivic.gov.in': { pass: 'Jamshedpur@123', role: 'DISTRICT_ADMIN', state: 'Jharkhand', district: 'Jamshedpur', name: 'District Admin - Jamshedpur' },
        'jh.bokaro.admin@crowdcivic.gov.in': { pass: 'Bokaro@123', role: 'DISTRICT_ADMIN', state: 'Jharkhand', district: 'Bokaro', name: 'District Admin - Bokaro' },
        'jh.hazaribagh.admin@crowdcivic.gov.in': { pass: 'Hazaribagh@123', role: 'DISTRICT_ADMIN', state: 'Jharkhand', district: 'Hazaribagh', name: 'District Admin - Hazaribagh' },
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        
        setTimeout(() => {
            const user = CREDENTIALS[email.toLowerCase()];

            if (user && user.pass === password) {
                
                const userData = {
                    email: email.toLowerCase(),
                    role: user.role,
                    state: user.state,
                    district: user.district || null,
                    name: user.name
                };

                localStorage.setItem('cc_admin_user', JSON.stringify(userData));
                navigate('/dashboard', { replace: true });
            } else {
                setError('Invalid email or password');
            }
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-brand">
                    <img src={logo} alt="JanVani Logo" className="admin-logo" />
                    <div className="admin-brand-text">
                        <h1>जनvani Admin</h1>
                        <p>Government of Jharkhand</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="admin-login-form">
                    <div className="form-group">
                        <label htmlFor="email">Official Email ID</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name.district@crowdcivic.gov.in"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Secure Login'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Restricted Access. Authorized Personnel Only.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
