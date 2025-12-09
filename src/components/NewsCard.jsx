import React, { useEffect, useState } from 'react';
import './NewsCard.css';
import { fetchJharkhandCrowdNews } from '../api/news';


export default function NewsCard() {
  const [index, setIndex] = useState(0);

  const [items, setItems] = useState([]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const data = await fetchJharkhandCrowdNews({ signal: ctrl.signal });
      setItems(data);
    })();
    const t = setInterval(() => {
      setIndex((prev) => {
        const len = Math.max(1, items.length || 1);
        return (prev + 1) % len;
      });
    }, 4000);
    return () => { clearInterval(t); ctrl.abort(); };
  }, []);

  const list = items.length ? items : [];
  const current = list[index % Math.max(1, list.length || 1)] || { title: 'Loading news…', source: '—', time: '' };

  return (
    <div className="news-card">
      <div className="news-header">
        <span className="dot live" />
        <h3>Jharkhand Crowd Issue - Live Updates</h3>
      </div>
      <div className="news-content">
        <div className="news-title">{current.title}</div>
        <div className="news-meta">
          <span>{current.source}</span>
          <span>•</span>
          <span>{current.time}</span>
        </div>
      </div>
    </div>
  );
}


