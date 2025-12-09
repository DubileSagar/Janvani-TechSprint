import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import template from '../assets/certificate-template-v2.png';
import { useLanguage } from '../context/LanguageContext';
import './Certificate.css';

const Certificate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = location.state || {};
    const [date, setDate] = useState('');

    useEffect(() => {
        
        const d = new Date();
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        setDate(d.toLocaleDateString('en-GB', options));

        
        document.fonts.ready.then(() => {
            console.log('Fonts loaded');
        });

    }, []);

    const handlePrint = () => {
        window.print();
    };

    const userName = user?.name || user?.user_metadata?.name || "Citizen Name";

    return (
        <div className="certificate-page">
            <div className="no-print-controls">
                <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
                <button onClick={handlePrint} className="print-btn">🖨️ Save as PDF / Print</button>
            </div>

            <div className="certificate-container" id="certificate-print-area">
                <img src={template} alt="Certificate Template" className="cert-bg" />

                {}
                <div className="cert-name">{userName}</div>
                <div className="cert-date">{date}</div>
            </div>
        </div>
    );
};

export default Certificate; 
