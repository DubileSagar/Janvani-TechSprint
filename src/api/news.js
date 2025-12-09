

const DEFAULT_HEADLINES = [
  { id: 's1', title: 'Crowd congestion near marketplaces causing delays for residents', source: 'Jharkhand Local Desk', time: 'now' },
  { id: 's2', title: 'Peak-hour queues at bus stands spark safety concerns in Ranchi', source: 'Civic Beat', time: '2m' },
  { id: 's3', title: 'Residents urge better crowd management for weekly haats', source: 'Community Watch', time: '5m' },
  { id: 's4', title: 'Encroachments narrowing key roads, intensifying crowding', source: 'City Updates', time: '8m' },
];

export async function fetchJharkhandCrowdNews({ signal } = {}) {
  try {
    
    const url = localStorage.getItem('cc_news_url') || '';
    if (!url) throw new Error('No URL configured');
    const resp = await fetch(url, { signal });
    if (!resp.ok) throw new Error(`News fetch failed ${resp.status}`);
    const data = await resp.json();
    const normalized = Array.isArray(data)
      ? data.slice(0, 15).map((item, i) => ({
          id: item.id || String(i),
          title: item.title || item.headline || 'Untitled',
          source: item.source || 'Feed',
          time: item.time || 'recent'
        }))
      : DEFAULT_HEADLINES;
    return normalized;
  } catch (_e) {
    return DEFAULT_HEADLINES;
  }
}


