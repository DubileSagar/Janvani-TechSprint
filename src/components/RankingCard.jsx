import React, { useState, useEffect } from 'react';
import './RankingCard.css';



export default function RankingCard({ title = 'Municipality Ranking', items = [], order = 'best-to-worst', scoreLabel = 'Effectiveness' }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    
    setAnimated(true);
  }, []);

  if (!Array.isArray(items)) return null;

  const sorted = [...items].map(item => ({
    ...item,
    score: item.score !== undefined ? item.score : (item.total ? item.resolved / item.total : 0)
  })).sort((a, b) => {
    
    
    return order === 'worst-to-best' ? a.score - b.score : b.score - a.score;
  });

  const getBadgeIcon = (score) => {
    if (score >= 0.80) return '🏆';
    if (score >= 0.65) return '🥇';
    if (score >= 0.50) return '🥈';
    return '';
  };

  return (
    <div className={`ranking-card ${animated ? 'animated' : ''}`}>
      <div className="ranking-header">
        <div>
          <h2 className="ranking-title">{title}</h2>
          <p className="ranking-subtitle">
            {order === 'worst-to-best'
              ? "Sorted by Lowest Resolution Rate (Needs Attention) first"
              : "Sorted by Highest Resolution Rate first"}
          </p>
        </div>
      </div>

      <ol className="ranking-list">
        {sorted.map((m, idx) => {
          const animationDelay = `${idx * 0.1}s`;
          const badgeIcon = getBadgeIcon(m.score);

          return (
            <li
              key={m.id ?? m.name}
              className="ranking-item"
              style={{ animationDelay }}
            >
              <div
                className={`rank-badge ${idx < 3 ? 'top-rank' : ''}`}
              >
                {idx + 1}
              </div>
              <div className="rank-info">
                <div className="rank-name">
                  {badgeIcon && <span style={{ marginRight: '6px' }}>{badgeIcon}</span>}
                  {m.name}
                </div>
                <div className="rank-score">
                  <span className="score-label">{scoreLabel}:</span>
                  <span className="score-value">{(m.score * 100).toFixed(0)}%</span>
                </div>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{ width: `${Math.min(100, Math.round(m.score * 100))}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {}
      <div className="badge-section">
        <h3 className="badge-title">Performance Tiers</h3>
        <div className="badge-groups">

          {}
          {(() => {
            const platinumItems = items.filter(m => (m.resolved / m.total) >= 0.80);
            return (
              <div className="badge-group platinum-group">
                <div className="group-header">
                  <span className="group-icon">🏆</span>
                  <span className="group-title">Platinum Districts</span>
                  <span className="group-criteria">(80%+)</span>
                </div>
                <div className="group-list">
                  {platinumItems.length > 0 ? (
                    platinumItems.map(m => (
                      <div key={m.id} className="group-item">
                        <span className="item-name">{m.name}</span>
                        <span className="item-score">{((m.resolved / m.total) * 100).toFixed(0)}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="group-item empty-state">No districts qualified yet</div>
                  )}
                </div>
              </div>
            );
          })()}

          {}
          {(() => {
            const goldItems = items.filter(m => {
              const score = m.resolved / m.total;
              return score >= 0.65 && score < 0.80;
            });
            return (
              <div className="badge-group gold-group">
                <div className="group-header">
                  <span className="group-icon">🥇</span>
                  <span className="group-title">Gold Districts</span>
                  <span className="group-criteria">(65-79%)</span>
                </div>
                <div className="group-list">
                  {goldItems.length > 0 ? (
                    goldItems.map(m => (
                      <div key={m.id} className="group-item">
                        <span className="item-name">{m.name}</span>
                        <span className="item-score">{((m.resolved / m.total) * 100).toFixed(0)}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="group-item empty-state">No districts qualified yet</div>
                  )}
                </div>
              </div>
            );
          })()}

          {}
          {(() => {
            const silverItems = items.filter(m => {
              const score = m.resolved / m.total;
              return score >= 0.50 && score < 0.65;
            });
            return (
              <div className="badge-group silver-group">
                <div className="group-header">
                  <span className="group-icon">🥈</span>
                  <span className="group-title">Silver Districts</span>
                  <span className="group-criteria">(50-64%)</span>
                </div>
                <div className="group-list">
                  {silverItems.length > 0 ? (
                    silverItems.map(m => (
                      <div key={m.id} className="group-item">
                        <span className="item-name">{m.name}</span>
                        <span className="item-score">{((m.resolved / m.total) * 100).toFixed(0)}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="group-item empty-state">No districts qualified yet</div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
