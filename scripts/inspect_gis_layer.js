import https from 'https';

// Query for Vijayawada (approx 16.5062, 80.6480)
const url = "https://apsac.ap.gov.in/gisserver/rest/services/ADMINISTRATIVE/administrative_boundaries/MapServer/1/query?geometry=80.6480,16.5062&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&f=json";

console.log(`Querying Point (Vijayawada): ${url}`);
https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.features && json.features.length > 0) {
                console.log("Feature Found:");
                console.log(JSON.stringify(json.features[0].attributes || json.features[0].properties, null, 2));
            } else {
                console.log("No features found at this location.", json);
            }
        } catch (e) {
            console.log("Failed to parse JSON:", data.substring(0, 200));
        }
    });
}).on('error', (err) => {
    console.log(`Network Error: ${err.message}`);
});
