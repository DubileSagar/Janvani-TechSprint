import React from 'react';
import './About.css';

import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t } = useLanguage();
  return (
    <div className="about">
      <div className="about-content">

        {}
        <section className="about-header">
          <h1>{t('about_title')}</h1>
          <p>{t('about_p1')}</p>
        </section>

        {}
        <div className="mission-vision-grid">
          <div className="mv-card">
            <span className="mv-icon">🎯</span>
            <h2>Our Mission</h2>
            <p>To empower every citizen with a voice that is heard, acknowledged, and acted upon, fostering a transparent and responsive governance model.</p>
          </div>
          <div className="mv-card">
            <span className="mv-icon">👁️</span>
            <h2>Our Vision</h2>
            <p>A digitally connected ecosystem where grievance redressal is seamless, efficient, and data-driven, creating cleaner and safer communities.</p>
          </div>
        </div>

        {}
        <section className="objectives-section">
          <h2>Key Objectives</h2>
          <ul className="objectives-list">
            <li><span className="check-icon">✓</span> Rapid Redressal of Civic Issues</li>
            <li><span className="check-icon">✓</span> Transparent Tracking & Accountability</li>
            <li><span className="check-icon">✓</span> Data-Driven Decision Making for Policy</li>
            <li><span className="check-icon">✓</span> Community Engagement & Participation</li>
          </ul>
        </section>

        {}
        <section className="about-header" style={{ marginTop: '20px', padding: '2rem' }}>
          <p>{t('about_p2')}</p>
        </section>

      </div>
    </div>
  );
};

export default About;
