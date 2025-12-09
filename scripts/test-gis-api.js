import { detectAdministrativeArea } from '../src/api/gis.js';

// Mock fetch for Node.js environment if needed, but we'll run this with node which has fetch in newer versions.
// If not, we might need a polyfill, but let's try running it directly first.

// Coordinates for Dhanbad, Jharkhand
const DHANBAD_LAT = 23.7957;
const DHANBAD_LNG = 86.4304;

// Coordinates for Guntur, Andhra Pradesh
const GUNTUR_LAT = 16.3067;
const GUNTUR_LNG = 80.4365;

async function testGis() {
    console.log("Testing GIS Detection...");

    try {
        console.log(`\n1. Testing Dhanbad (${DHANBAD_LAT}, ${DHANBAD_LNG})...`);
        const result1 = await detectAdministrativeArea(DHANBAD_LAT, DHANBAD_LNG);
        console.log("Result:", JSON.stringify(result1, null, 2));
    } catch (error) {
        console.error("Dhanbad Test Failed:", error);
    }

    try {
        console.log(`\n2. Testing Guntur (${GUNTUR_LAT}, ${GUNTUR_LNG})...`);
        const result2 = await detectAdministrativeArea(GUNTUR_LAT, GUNTUR_LNG);
        console.log("Result:", JSON.stringify(result2, null, 2));
    } catch (error) {
        console.error("Guntur Test Failed:", error);
    }
}

testGis();
