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
const TABLE_ID_JH_REPORTS = 'jharkhand_reports';

// User Info
const USER_PHONE = '+919876543210'; // Dummy phone for demo
const USER_NAME = 'Sagar';

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
    { name: "Dhanbad", lat: 23.7957, lng: 86.4304 },
    { name: "Ranchi", lat: 23.3441, lng: 85.3096 },
    { name: "Jamshedpur", lat: 22.8046, lng: 86.2029 },
    { name: "Bokaro", lat: 23.6693, lng: 86.1511 },
    { name: "Hazaribagh", lat: 23.9933, lng: 85.3677 }
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
    console.log("Starting upload of 100 demo reports for Jharkhand...");
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
                reporterPhone: USER_PHONE,
                issueTitle: `${issueType} in ${district.name}`,
                description: `This is a demo report for a ${issueType.toLowerCase()} observed in ${district.name}.`,
                issueTypeId: "demo_type", // Placeholder
                status: status,
                lat: coords.lat,
                lng: coords.lng,
                address: JSON.stringify({
                    street: `${Math.floor(Math.random() * 100)}th Street`,
                    city: district.name,
                    district: district.name,
                    state: "Jharkhand",
                    country: "India",
                    postalCode: "826001" // Dummy pincode
                }),
                state: "Jharkhand",
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

                // 2. Create in State DB (Jharkhand)
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
                delete stateData.reporterPhone;
                delete stateData.status;
                delete stateData.category;
                delete stateData.reporterName;
                delete stateData.userId;

                await databases.createDocument(
                    STATE_DB_ID,
                    TABLE_ID_JH_REPORTS,
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
