import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Issues.css';
import { dbService } from '../api/db';
import { useLanguage } from '../context/LanguageContext';

const POINTS_PER_RESOLVED = 50;

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

const Issues = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [userPhone, setUserPhone] = useState('');
  const [upvoteIds, setUpvoteIds] = useState([]);
  const [filter, setFilter] = useState('raised'); 
  const [myReportsState, setMyReportsState] = useState([]);

  
  useEffect(() => {
    
    try {
      let phone = localStorage.getItem('cc_user_phone');
      const user = localStorage.getItem('cc_user');
      if (user) {
        try {
          const u = JSON.parse(user);
          if (u.phone) phone = u.phone;
        } catch (e) { }
      }
      if (phone) setUserPhone(phone);

      const upvotes = localStorage.getItem('cc_user_upvotes');
      if (upvotes) setUpvoteIds(JSON.parse(upvotes));
    } catch (e) {
      console.error("Error loading user data", e);
    }
  }, []);

  
  const fetchReports = async () => {
    try {
      const data = await dbService.getReports();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    }
  };

  
  useEffect(() => {
    const fetchUserReports = async () => {
      if (!userPhone) return;
      try {
        const data = await dbService.getReportsByUser(userPhone);
        setMyReportsState(data);
      } catch (err) {
        console.error("Failed to fetch user reports", err);
      }
    };
    fetchUserReports();
  }, [userPhone]);

  useEffect(() => {
    fetchReports();
    
    const onFocus = () => {
      fetchReports();
      if (userPhone) {
        dbService.getReportsByUser(userPhone).then(setMyReportsState).catch(() => { });
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userPhone]);

  
  
  const myReports = myReportsState;

  const upvotedReports = useMemo(() => {
    return reports.filter(r => upvoteIds.includes(r.$id || r.id));
  }, [reports, upvoteIds]);

  const displayedReports = useMemo(() => {
    if (filter === 'raised') return myReports;
    if (filter === 'upvoted') return upvotedReports;
    
    const combined = [...myReports];
    upvotedReports.forEach(r => {
      if (!combined.find(x => x.$id === r.$id)) {
        combined.push(r);
      }
    });
    return combined.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
  }, [filter, myReports, upvotedReports]);

  const resolvedCount = myReports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;
  const totalPoints = resolvedCount * POINTS_PER_RESOLVED;

  
  const getStatusKey = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'resolved') return 'status_resolved';
    if (s === 'rejected') return 'issue_status_rejected';
    if (s.includes('progress') || s === 'wip') return 'status_wip';
    return 'status_raised';
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'resolved') return 'resolved';
    if (s === 'rejected') return 'rejected'; 
    if (s.includes('progress') || s === 'wip') return 'in-progress';
    return 'open';
  };

  return (
    <div className="issues-page">
      <div className="issues-header">
        <h1>{t('issues_title')}</h1>
        <div className="profile-meta">
          <div className="meta-item"><span className="label">Phone:</span> <span className="value">{userPhone || '-'}</span></div>
          <div className="meta-item"><span className="label">{t('status_raised')}:</span> <span className="value">{myReports.length}</span></div>
          <div className="meta-item"><span className="label">{t('status_resolved')}:</span> <span className="value">{resolvedCount}</span></div>
          <div className="meta-item"><span className="label">Rewards:</span> <span className="value">{totalPoints} pts</span></div>
        </div>
      </div>

      <div className="complaints-list">
        <div className="tabs">
          <button className={`tab ${filter === 'raised' ? 'active' : ''}`} onClick={() => setFilter('raised')}>{t('filter_raised') || 'Raised Issues'}</button>
          <button className={`tab ${filter === 'upvoted' ? 'active' : ''}`} onClick={() => setFilter('upvoted')}>{t('filter_upvoted') || 'Upvoted Issues'}</button>
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('filter_all') || 'All Activity'}</button>
        </div>

        {displayedReports.length === 0 ? (
          <div className="empty">{t('no_reports') || 'No reports found.'}</div>
        ) : (
          <ul className="complaint-items">
            {displayedReports.map(r => {
              const isUpvoted = upvoteIds.includes(r.id || r.$id);
              const isMine = r.reporterPhone === userPhone;
              const statusKey = getStatusKey(r.status);
              const statusClass = getStatusClass(r.status);

              return (
                <li key={r.id || r.$id} className="complaint-item" onClick={() => navigate(`/issue/${r.id || r.$id}`)}>
                  <div className="top">
                    <div className="title-row">
                      <div className="title">{r.issueTitle || t('issue_details_title')}</div>
                      <div className="badges">
                        {isUpvoted && <span className="badge upvoted">{t('status_upvoted')}</span>}
                        {isMine && <span className="badge mine">{t('badge_mine') || 'My Issue'}</span>}
                      </div>
                    </div>
                    <div className={`status ${statusClass}`}>
                      {t(statusKey)}
                    </div>
                  </div>
                  <div className="details">
                    <div className="row"><span className="label">{t('label_desc')}:</span><span className="value">{r.description || '-'}</span></div>
                    <div className="row"><span className="label">{t('label_upvotes')}:</span><span className="value">{r.upvotes || 0}</span></div>
                    <div className="row"><span className="label">{t('label_date')}:</span><span className="value">{formatDate(r.$createdAt || r.createdAt)}</span></div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Issues;
