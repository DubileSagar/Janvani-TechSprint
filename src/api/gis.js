import * as turf from '@turf/turf';


const LAYERS = [
    {
        name: "Jharkhand (CSC Admin)",
        url: "https://stategisportal.nic.in/dbt/rest/services/dbt/CSC_Admin/MapServer/1",
        description: "Jharkhand Administrative Boundaries"
    },
    {
        name: "Andhra Pradesh (APSAC)",
        url: "https://apsac.ap.gov.in/gisserver/rest/services/ADMINISTRATIVE/administrative_boundaries/MapServer/1",
        description: "Andhra Pradesh District Boundaries"
    },
    {
        name: "All India (BharatMap)",
        url: "https://mapservice.gov.in/gismap/rest/services/BharatMapService/Admin_Boundary_District/MapServer/0",
        description: "Fallback for other states"
    }
];

export const GIS_ERRORS = {
    NO_DATA: 'NO_DATA',
    NETWORK_ERROR: 'NETWORK_ERROR',
    MULTIPLE_MATCHES: 'MULTIPLE_MATCHES'
};


export async function detectAdministrativeArea(lat, lon) {
    let lastError = null;

    
    for (const layer of LAYERS) {
        try {
            console.log(`Querying GIS Layer: ${layer.name}...`);

            
            const serverResult = await queryArcGISServer(layer.url, lat, lon);

            
            if (serverResult) {
                const name = serverResult.areaName;
                
                if (name && !name.includes("Unknown Area") && name.toUpperCase() !== 'UNRESTRICTED') {
                    return { ...serverResult, confidence: 'high', source: layer.name };
                } else {
                    console.warn(`Layer ${layer.name} returned invalid name: ${name}. Skipping...`);
                }
            }
        } catch (error) {
            console.warn(`Layer ${layer.name} query failed:`, error);
            lastError = error;
        }
    }

    
    
    try {
        console.log("Attempting client-side fallback on primary layer...");
        const fallbackResult = await performClientSideCheck(LAYERS[0].url, lat, lon);
        return fallbackResult;
    } catch (error) {
        console.error("Client-side fallback failed:", error);
        if (error.code) throw error;

        throw {
            code: GIS_ERRORS.NETWORK_ERROR,
            message: "Failed to detect area. Please check your connection."
        };
    }
}

async function queryArcGISServer(layerUrl, lat, lon) {
    
    const queryUrl = `${layerUrl}/query?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&f=geojson`;

    const response = await fetch(queryUrl);
    if (!response.ok) throw new Error(`Server returned ${response.status}`);

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
        return null;
    }

    
    return formatResult(data.features[0]);
}

async function performClientSideCheck(layerUrl, lat, lon) {
    
    
    const queryUrl = `${layerUrl}/query?where=1=1&outFields=*&f=geojson`;
    const response = await fetch(queryUrl);
    if (!response.ok) throw new Error("Failed to download layer for fallback");

    const geojson = await response.json();
    if (!geojson.features || geojson.features.length === 0) {
        throw { code: GIS_ERRORS.NO_DATA, message: "No administrative data available." };
    }

    const point = turf.point([lon, lat]);

    
    const containing = geojson.features.filter(feature =>
        turf.booleanPointInPolygon(point, feature)
    );

    let bestMatch = null;
    let confidence = 'high';
    let alternatives = [];

    if (containing.length > 0) {
        
        bestMatch = containing[0];

        
        const distToBoundary = getMinDistanceToBoundary(point, bestMatch);

        if (distToBoundary <= 10) {
            confidence = 'low';
            
            alternatives = findNearbyPolygons(point, geojson.features, bestMatch);
        } else if (containing.length > 1) {
            
            confidence = 'low'; 
            alternatives = containing.slice(1).map(formatResult);
        }

    } else {
        
        const nearest = findNearestPolygon(point, geojson.features);

        if (nearest && nearest.distance <= 10) {
            bestMatch = nearest.feature;
            confidence = 'low';
            alternatives = findNearbyPolygons(point, geojson.features, bestMatch);
        } else {
            throw { code: GIS_ERRORS.NO_DATA, message: "Location is outside known administrative areas." };
        }
    }

    return {
        ...formatResult(bestMatch),
        confidence,
        alternatives: alternatives.length > 0 ? alternatives.map(formatResult) : undefined
    };
}

function getMinDistanceToBoundary(point, polygonFeature) {
    
    const lines = turf.polygonToLine(polygonFeature);
    const lineFeatures = lines.type === 'FeatureCollection' ? lines.features : [lines];

    let minDistance = Infinity;
    lineFeatures.forEach(line => {
        const dist = turf.pointToLineDistance(point, line, { units: 'meters' });
        if (dist < minDistance) minDistance = dist;
    });

    return minDistance;
}

function findNearestPolygon(point, features) {
    let nearest = null;
    let minDistance = Infinity;

    features.forEach(feature => {
        const dist = getMinDistanceToBoundary(point, feature);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = feature;
        }
    });

    return nearest ? { feature: nearest, distance: minDistance } : null;
}

function findNearbyPolygons(point, allFeatures, excludeFeature) {
    
    
    const threshold = 20;

    return allFeatures.filter(f => {
        if (f === excludeFeature) return false;
        const dist = getMinDistanceToBoundary(point, f);
        return dist <= threshold;
    });
}

function formatResult(feature) {
    const props = feature.properties || {};

    
    const candidates = [
        'name', 'NAME', 'Name',
        'district', 'DISTRICT', 'District',
        'dstrctnam', 'DSTRCTNAM', 
        'dtname', 'DTNAME',
        'stname', 'STNAME',
        'admin_level_2',
        'district_name', 'DISTRICT_NAME'
    ];

    let name = null;

    for (const key of Object.keys(props)) {
        if (candidates.includes(key)) {
            const val = props[key];
            if (val && typeof val === 'string' && val.toUpperCase() !== 'UNRESTRICTED') {
                name = val;
                break;
            }
        }
    }

    
    if (!name) {
        const nameKey = Object.keys(props).find(k => k.toLowerCase().includes('name'));
        if (nameKey) {
            const val = props[nameKey];
            if (val && typeof val === 'string' && val.toUpperCase() !== 'UNRESTRICTED') {
                name = val;
            }
        }
    }

    
    if (!name) {
        const keys = Object.keys(props).join(', ');
        name = `Unknown Area (Keys: ${keys})`;
    }

    return {
        areaName: name,
        areaType: "District",
        layerId: 0,
        properties: props
    };
}
