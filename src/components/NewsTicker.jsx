import React from 'react';
import './NewsTicker.css';

const NewsTicker = () => {
    const newsItems = [
        "📢 Welcome to JanVani - Your Voice, Our Action!",
        "🌧️ Heavy Rain Alert: promoting safety in Ranchi district.",
        "🏆 Jharkhand ranks Top 5 in Citizen Grievance Redressal.",
        "🏥 New Health Camp opening in Bokaro this Sunday.",
        "🏗️ Road repairs scheduled for Main Road, Ranchi - Expect delays.",
        "✅ 10,000+ Civic Issues resolved this month!"
    ];

    return (
        <div className="news-ticker-container">
            <div className="ticker-label">LATEST UPDATES</div>
            <div className="ticker-wrap">
                <div className="ticker-move">
                    {newsItems.map((item, index) => (
                        <div className="ticker-item" key={index}>
                            {item}
                        </div>
                    ))}
                    {}
                    {newsItems.map((item, index) => (
                        <div className="ticker-item" key={`dup-${index}`}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewsTicker;
