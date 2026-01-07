import React from 'react';
import './NewsTicker.css';

const NewsTicker = ({ state }) => {
    const defaultNews = [
        "📢 Welcome to JanVani - Your Voice, Our Action!",
        "🇮🇳 India celebrates 75 years of Independence - Azadi Ka Amrit Mahotsav.",
        "📱 Download the JanVani Mobile App for easier reporting.",
        "✅ Over 1 Lakh grievances resolved nationally this year."
    ];

    const stateNews = {
        "Jharkhand": [
            "🌧️ Heavy Rain Alert: promoting safety in Ranchi district.",
            "🏆 Jharkhand ranks Top 5 in Citizen Grievance Redressal.",
            "🏥 New Health Camp opening in Bokaro this Sunday.",
            "🏗️ Road repairs scheduled for Main Road, Ranchi - Expect delays."
        ],
        "Maharashtra": [
            "🚇 Mumbai Metro Line 3 to be fully operational by next month.",
            "🌧️ Orange Alert issued for Pune and surrounding ghat areas.",
            "🌾 New subsidy scheme announced for farmers in Vidarbha.",
            "🚧 Coastal Road project reaches 90% completion."
        ],
        "Delhi": [
            "pollution🌫️ GRAP Stage 2 implemented to tackle rising pollution.",
            "🚌 500 New Electric Buses added to DTC fleet today.",
            "🏫 Admissions open for Schools of Excellence.",
            "💊 Mohalla Clinics to run 24/7 in select areas."
        ],
        "Andhra Pradesh": [
            "🌊 Cyclone Warning: Fishermen advised not to venture into sea.",
            "💻 Visakhapatnam to host Global Tech Summit 2024.",
            "🌾 Rythu Bharosa funds to be released next week.",
            "🛣️ Vijayawada-Amaravati highway expansion approved."
        ]
    };

    const newsItems = (state && stateNews[state])
        ? [...stateNews[state], ...defaultNews]
        : defaultNews;

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
                    { }
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
