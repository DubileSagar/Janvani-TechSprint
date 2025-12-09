import { databases } from '../appwrite';
import { Query } from 'appwrite';

const KEY = 'cc_municipality_stats';
const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID_AP_DISTRICTS = 'tb_ap_districts';
const TABLE_ID_JH_DISTRICTS = 'tb_jharkhand_districts';

const DEFAULT_STATS = [
  { id: 1, name: 'District 1', resolved: 190, total: 240 },
  { id: 2, name: 'District 2', resolved: 165, total: 230 },
  { id: 3, name: 'District 3', resolved: 140, total: 220 },
  { id: 4, name: 'District 4', resolved: 110, total: 210 },
  { id: 5, name: 'District 5', resolved: 95, total: 205 },
];

export async function fetchMunicipalityStats({ signal } = {}) {
  try {
    const url = localStorage.getItem('cc_stats_url') || '';
    if (url) {
      const resp = await fetch(url, { signal });
      if (!resp.ok) throw new Error(`Stats fetch failed ${resp.status}`);
      const data = await resp.json();
      if (Array.isArray(data) && data.length) {
        saveStats(data);
        return data;
      }
    }
  } catch (_e) {
    
  }
  const local = loadStats();
  return local.length ? local : DEFAULT_STATS;
}

export async function fetchDistrictStats(state) {
  try {
    console.log("fetchDistrictStats called with:", state);
    let tableId = null;
    if (state === "Andhra Pradesh") {
      tableId = TABLE_ID_AP_DISTRICTS;
    } else if (state === "Jharkhand") {
      tableId = TABLE_ID_JH_DISTRICTS;
    }

    console.log("Selected Table ID:", tableId);

    if (!tableId) {
      
      console.warn("Unknown state or no state, falling back to AP");
      tableId = TABLE_ID_AP_DISTRICTS;
    }

    
    const response = await databases.listDocuments(
      DB_ID,
      tableId,
      [Query.limit(100)] 
    );

    
    const stats = response.documents.map(doc => {
      const total = Math.floor(Math.random() * 500) + 100; 
      const resolved = Math.floor(Math.random() * total); 
      return {
        id: doc.$id,
        name: doc.name,
        resolved: resolved,
        total: total
      };
    });

    
    stats.sort((a, b) => (b.resolved / b.total) - (a.resolved / a.total));

    return stats; 

  } catch (error) {
    console.error("Error fetching district stats:", error);
    return DEFAULT_STATS; 
  }
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_e) {
    return [];
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch (_e) { }
}
