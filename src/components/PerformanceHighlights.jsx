import React from 'react';
import './PerformanceHighlights.css';

const PerformanceHighlights = ({ items }) => {
    if (!items || items.length < 6) return null;

    
    const top3 = [...items]
        .sort((a, b) => (b.resolved / b.total) - (a.resolved / a.total))
        .slice(0, 3);

    
    const bottom3 = [...items]
        .sort((a, b) => (a.resolved / a.total) - (b.resolved / b.total))
        .slice(0, 3);

    return (
        <div className="performance-highlights-container">
            <h2 className="section-title">District Performance Snapshot</h2>
            <div className="highlights-grid">

                {}
                <div className="highlight-card top-performers">
                    <div className="card-header">
                        <span className="icon">🏆</span>
                        <h3>Top 3 Performing</h3>
                    </div>
                    <div className="list-container">
                        {top3.map((m, i) => (
                            <div key={m.id} className="list-item">
                                <div className="rank-circle">#{i + 1}</div>
                                <div className="name">{m.name}</div>
                                <div className="score">{((m.resolved / m.total) * 100).toFixed(0)}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {}
                <div className="highlight-card bottom-performers">
                    <div className="card-header">
                        <span className="icon">⚠️</span>
                        <h3>Needs Improvement</h3>
                    </div>
                    <div className="list-container">
                        {bottom3.map((m, i) => (
                            <div key={m.id} className="list-item">
                                <div className="rank-circle">#{items.length - i}</div>
                                <div className="name">{m.name}</div>
                                <div className="score">{((m.resolved / m.total) * 100).toFixed(0)}%</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PerformanceHighlights;
