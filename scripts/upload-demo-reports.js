import { Client, Databases, ID } from 'node-appwrite';

// Configuration
const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '692b234e002f52aa5dec';
const API_KEY = process.argv[2]; // Pass API Key as argument

// Main DB
const DB_ID = '692b24770032935a55f9';
const TABLE_ID_REPORTS = 'tb01';

// State DB
const STATE_DB_ID = '69306f670031d80567e0';
const TABLE_ID_AP_REPORTS = 'ap_reports';

// User Info
const USER_ID = '692b2aab001413c581ba';
const USER_NAME = 'Sagar';
const USER_PHONE = '+919876543210'; // Dummy phone for demo

if (!API_KEY) {
    console.error("Error: Please provide Appwrite API Key as an argument.");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

const DISTRICTS = [
    { name: "Guntur", lat: 16.3067, lng: 80.4365 },
    { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
    { name: "Kurnool", lat: 15.8281, lng: 78.0373 },
    { name: "Tirupati", lat: 13.6288, lng: 79.4192 },
    { name: "Anantapur", lat: 14.6819, lng: 77.6006 }
];

const ISSUE_TYPES = [
    "Pothole", "Garbage Dump", "Water Leakage", "Broken Streetlight",
    "Illegal Parking", "Drainage Blockage", "Stray Animal Menace"
];

const STATUSES = ["open", "in-progress", "resolved"];

// Helper to generate random coordinate
function getRandomCoordinate(centerLat, centerLng) {
    const r = 0.05;
    const lat = centerLat + (Math.random() - 0.5) * r * 2;
    const lng = centerLng + (Math.random() - 0.5) * r * 2;
    return { lat, lng };
}

async function uploadReports() {
    console.log("Starting upload of 100 demo reports...");
    let successCount = 0;

    for (const district of DISTRICTS) {
        console.log(`\nProcessing district: ${district.name}...`);

        for (let i = 0; i < 20; i++) {
            const coords = getRandomCoordinate(district.lat, district.lng);
            const issueType = ISSUE_TYPES[Math.floor(Math.random() * ISSUE_TYPES.length)];
            const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

            // Data for Main DB
            const reportData = {
                name: USER_NAME,
                // reporterName: USER_NAME, // Removed as per error
                reporterPhone: USER_PHONE, // Required field
                issueTitle: `${issueType} in ${district.name}`,
                description: `This is a demo report for a ${issueType.toLowerCase()} observed in ${district.name}.`,
                // category: issueType, // Removed as per error
                // Actually Report.jsx sends: name, issueTypeId, issueTitle, description, lat, lng, address, gisData, district, state, upvotes, status, reporterPhone, imageId
                // It does NOT send userId.

                issueTypeId: "demo_type", // Placeholder
                status: status,
                lat: coords.lat,
                lng: coords.lng,
                address: JSON.stringify({
                    street: `${Math.floor(Math.random() * 100)}th Street`,
                    city: district.name,
                    district: district.name,
                    state: "Andhra Pradesh",
                    country: "India",
                    postalCode: "500000"
                }),
                state: "Andhra Pradesh",
                district: district.name,
                imageId: "demo_image_id",
                upvotes: Math.floor(Math.random() * 50)
            };

            try {
                // 1. Create in Main DB
                await databases.createDocument(
                    DB_ID,
                    TABLE_ID_REPORTS,
                    ID.unique(),
                    reportData
                );
                process.stdout.write('.'); // Progress dot

                // 2. Create in State DB (AP)
                // Prepare data for State DB (convert types if needed)
                const stateData = {
                    ...reportData,
                    lat: String(reportData.lat),
                    lng: String(reportData.lng),
                    issueTypeId: String(reportData.issueTypeId),
                    upvotes: Number(reportData.upvotes)
                };

                // Remove fields not in state schema
                delete stateData.gisData;
                delete stateData.reporterPhone; // Not in State DB schema yet
                delete stateData.status;
                delete stateData.category;
                delete stateData.reporterName; // Just in case
                delete stateData.userId; // Just in case

                await databases.createDocument(
                    STATE_DB_ID,
                    TABLE_ID_AP_REPORTS,
                    ID.unique(),
                    stateData
                );

                successCount++;
            } catch (error) {
                console.error(`\nFailed to upload report for ${district.name}:`, error.message);
            }
        }
    }

    console.log(`\n\nUpload Complete! Successfully created ${successCount} reports.`);
}

uploadReports();
