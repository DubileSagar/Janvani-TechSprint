import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import RankingCard from './RankingCard';
import NewsCard from './NewsCard';
import { dbService } from '../api/db';
import IssueMap from './IssueMap';
import PerformanceHighlights from './PerformanceHighlights';
import { civicIssues } from '../constants/civicIssues';
import { useLanguage } from '../context/LanguageContext';
import NewsTicker from './NewsTicker';
import heroBg from '../assets/hero-bg.jpg';

import swachhBg from '../assets/swachh-bg.png';
import impactBg from '../assets/impact-bg.png';

const BrandingStrip = () => (
  <div className="branding-strip">
    <div className="branding-content">
      <div className="gov-logos-left">
        <div className="gov-text">
          <span className="gov-top">Government of India</span>
          <span className="gov-main">Accelerating Growth, Empowering Citizens</span>
        </div>
      </div>
      <div className="gov-logos-right">
        { }
        <div className="logo-badge g20">G20 🇮🇳</div>
        <div className="logo-badge swachh">Swachh Bharat</div>
        <div className="logo-badge amrit">Azadi Ka Amrit Mahotsav</div>
      </div>
    </div>
  </div>
);

const HeroCarousel = ({ t }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: heroBg,
      title: t('hero_title'),
      desc: t('hero_desc'),
      cta: t('hero_cta'),
      link: "/report",
      hasOverlay: true
    },
    {
      id: 2,

      image: swachhBg,
      title: "Swachh Bharat Abhiyan",
      titleColor: '#ffffff',
      descColor: '#f0fdf4',
      desc: "Join the movement for a cleaner, greener India. Your contribution matters.",
      cta: "View Campaign",
      link: "/about",
      hasOverlay: true
    },
    {
      id: 3,

      image: impactBg,
      title: "10,000+ Issues Resolved",
      titleColor: '#ffffff',
      descColor: '#f0fdf4',
      desc: "Citizens and administration working together for rapid grievance redressal.",
      cta: "See Impact",
      link: "/home",
      hasOverlay: true
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="hero-carousel">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          style={slide.image ? { backgroundImage: `url(${slide.image})` } : slide.style}
        >
          {slide.hasOverlay && <div className="hero-overlay"></div>}
          <div className="hero-content">
            <h1 style={slide.titleColor ? { color: slide.titleColor } : {}}>{slide.title}</h1>
            <p style={slide.descColor ? { color: slide.descColor } : {}}>{slide.desc}</p>
            <Link to={slide.link} className="cta-button">{slide.cta}</Link>
          </div>
        </div>
      ))}
      <div className="carousel-dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            style={{ border: '1px solid #ccc' }}
          ></span>
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const { t } = useLanguage();

  const [activeCategory, setActiveCategory] = useState('All');


  const [municipalityStats, setMunicipalityStats] = React.useState([]);
  const [recentReports, setRecentReports] = React.useState([]);
  const [loadingReports, setLoadingReports] = React.useState(true);
  const [userState, setUserState] = React.useState('');

  const categories = ['All', 'Infrastructure', 'Sanitation', 'Safety', 'Community', 'Transport'];

  React.useEffect(() => {
    const ctrl = new AbortController();


    import('../supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && user.user_metadata && user.user_metadata.state) {
          console.log("Home: Found logged-in user state:", user.user_metadata.state);
          setUserState(user.user_metadata.state);
        } else {
          // If no user (or no state in profile), try IP detection
          console.log("Home: No user state, attempting IP detection...");
          const API_URL = import.meta.env.VITE_API_BASE_URL || '';
          fetch(`${API_URL}/api/check-access`) // Reuse this endpoint as it returns IPInfo data
            .then(res => res.json())
            .then(data => {
              if (data.details && data.details.region) {
                console.log("Home: Detected region from IP:", data.details.region);
                setUserState(data.details.region);
              } else {
                console.warn("Home: IP region not found, defaulting to Andhra Pradesh");
                setUserState('Andhra Pradesh');
              }
            })
            .catch(err => {
              console.warn("Home: Location detection failed, defaulting to Andhra Pradesh", err);
              setUserState('Andhra Pradesh');
            });
        }
      });
    });

    const fetchReports = () => {

      dbService.getReports(200)
        .then(reports => {
          setRecentReports(reports);
        })
        .catch(e => console.error("Reports fetch failed:", e))
        .finally(() => setLoadingReports(false));
    };

    fetchReports();


    const onFocus = () => fetchReports();
    window.addEventListener('focus', onFocus);

    return () => {
      ctrl.abort();
      window.removeEventListener('focus', onFocus);
    };
  }, []);


  React.useEffect(() => {
    if (!userState) {
      console.log("Home: userState is empty, skipping stats fetch");
      return;
    }
    console.log("Home: Fetching stats for state:", userState);

    import('../api/stats').then(({ fetchDistrictStats }) => {
      fetchDistrictStats(userState)
        .then(stats => {
          const withScore = stats.map(m => ({ ...m, score: (m.resolved / Math.max(1, m.total)) }));
          setMunicipalityStats(withScore);
        })
        .catch(e => console.error("Stats fetch failed:", e));
    });
  }, [userState]);


  const filteredIssues = civicIssues.filter(issue => {
    const matchesCategory = activeCategory === 'All' || issue.category === activeCategory;
    return matchesCategory;
  });

  return (
    <div className="home">
      <BrandingStrip />
      <NewsTicker />
      <HeroCarousel t={t} />



      <PerformanceHighlights items={municipalityStats} />

      { }
      <section className="trending-section">
        <div className="section-header">
          <h2>Trending Services</h2>
          <p>Frequently used services citizens are accessing right now</p>
        </div>
        <div className="trending-grid">
          {civicIssues.slice(0, 3).map((issue) => (
            <Link to="/report" key={issue.id} className="trending-card">
              <div className="trending-icon">{issue.icon}</div>
              <div className="trending-info">
                <h4>{issue.title}</h4>
                <span>Report Issue →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="map-section" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-header">
          <h2>{t('map_title')}</h2>
          <p>{t('map_desc')}</p>
        </div>
        <IssueMap reports={recentReports} />
      </section>

      <section className="issues-grid">
        <div className="section-header">
          <h2>{t('common_issues_title')}</h2>
          <p>{t('common_issues_desc')}</p>
        </div>

        { }
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="issues-container">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <div key={issue.id} className="issue-card">
                <div className="card-icon">{issue.icon}</div>
                <h3>{t(`issue_${issue.id}_title`) || issue.title}</h3>
                <p>{t(`issue_${issue.id}_desc`) || issue.description}</p>
                <Link to="/report" className="card-link">{t('card_report_btn')}</Link>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#666' }}>
              No services found matching your criteria.
            </div>
          )}
        </div>
      </section>

      <section className="ranking">
        <RankingCard
          title={userState ? `${t('ranking_title')} - ${userState}` : t('ranking_title')}
          items={municipalityStats}
          order="worst-to-best"
          scoreLabel={t('ranking_effectiveness')}
        />
      </section>
    </div>
  );
};

export default Home;