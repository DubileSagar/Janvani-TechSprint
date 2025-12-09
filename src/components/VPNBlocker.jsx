import React from 'react';

const VPNBlocker = ({ onRetry, details }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)', 
            backdropFilter: 'blur(12px)', 
            WebkitBackdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .vpn-card {
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                        padding: 3rem;
                        border-radius: 20px;
                        text-align: center;
                        max-width: 500px;
                        width: 90%;
                        color: white;
                        animation: slideUp 0.4s ease-out;
                    }
                    .retry-btn:hover {
                        transform: scale(1.05);
                        background: #ff4444 !important;
                        box-shadow: 0 0 15px rgba(255, 68, 68, 0.4);
                    }
                `}
            </style>

            <div className="vpn-card">
                <div style={{ fontSize: '4.5rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.5))' }}>
                    🛡️
                </div>

                <h1 style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #ff4444, #ff8888)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Connection Restricted
                </h1>

                <div style={{ background: 'rgba(255, 68, 68, 0.15)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255, 68, 68, 0.3)' }}>
                    <p style={{ margin: 0, color: '#ffaaaa', fontWeight: '500' }}>
                        Compliance Issue Detected
                    </p>
                    {details && (
                        <p style={{ margin: '10px 0 0 0', color: '#ffcccc', fontSize: '0.8rem', opacity: 0.8 }}>
                            Reason: {JSON.stringify(details)}
                        </p>
                    )}
                </div>

                <p style={{ lineHeight: '1.6', fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', marginBottom: '2.5rem' }}>
                    To ensure the integrity of the <strong>JanVani Platform</strong>, access via VPNs, Proxies, or Anonymizers is strictly prohibited.
                    <br /><br />
                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Please disable any active VPN connections and try again.</span>
                </p>

                <button
                    className="retry-btn"
                    onClick={onRetry}
                    style={{
                        padding: '14px 32px',
                        background: '#333',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        letterSpacing: '0.5px'
                    }}
                >
                    🔄  Recheck Connection
                </button>
            </div>
        </div>
    );
};

export default VPNBlocker;
