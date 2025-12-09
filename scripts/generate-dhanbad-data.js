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
const USER_PHONE = '+919876543210';
const USER_NAME = 'Demo User';

// if (!API_KEY) {
//     console.error("Error: Please provide Appwrite API Key as an argument.");
//     process.exit(1);
// }

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);
// .setKey(API_KEY);

const databases = new Databases(client);

const DHANBAD_COORDS = { lat: 23.7957, lng: 86.4304 };

const CIVIC_ISSUES = [
    { id: 1, title: "Potholes & Road Damage" },
    { id: 2, title: "Street Lighting" },
    { id: 3, title: "Waste Management" },
    { id: 4, title: "Water & Sewage" },
    { id: 5, title: "Public Spaces" },
    { id: 6, title: "Traffic & Safety" },
    { id: 7, title: "Sidewalk Maintenance" },
    { id: 8, title: "Illegal Dumping" },
    { id: 9, title: "Graffiti & Vandalism" },
    { id: 10, title: "Abandoned Vehicles" },
    { id: 11, title: "Noise Complaints" },
    { id: 12, title: "Broken Playground Equipment" },
    { id: 13, title: "Fallen Trees" },
    { id: 14, title: "Flooding" },
    { id: 15, title: "Public Transport Issues" },
    { id: 16, title: "Utility Pole Fire/Electrical Hazard" },
    { id: 17, title: "Others" }
];

const STATUSES = ["new", "in-progress", "resolved"];

// Helper to generate random coordinate within ~5km radius
function getRandomCoordinate(centerLat, centerLng) {
    const r = 0.045; // Approx 5km
    const lat = centerLat + (Math.random() - 0.5) * r * 2;
    const lng = centerLng + (Math.random() - 0.5) * r * 2;
    return { lat, lng };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateReports() {
    console.log("Starting generation of 150 demo reports for Dhanbad...");
    let successCount = 0;

    for (let i = 0; i < 150; i++) {
        await sleep(2000); // Wait 2000ms between requests to avoid rate limits
        const coords = getRandomCoordinate(DHANBAD_COORDS.lat, DHANBAD_COORDS.lng);
        const issue = CIVIC_ISSUES[Math.floor(Math.random() * CIVIC_ISSUES.length)];
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

        // Data for Main DB
        const reportData = {
            name: USER_NAME,
            reporterPhone: USER_PHONE,
            issueTitle: `${issue.title} in Dhanbad`,
            description: `Demo report for ${issue.title} observed in Dhanbad area.`,
            issueTypeId: String(issue.id),
            issueType: issue.title.substring(0, 32), // Legacy field, max 32 chars
            status: status,
            lat: coords.lat,
            lng: coords.lng,
            address: JSON.stringify({
                street: `${Math.floor(Math.random() * 100)}th Road`,
                city: "Dhanbad",
                district: "Dhanbad",
                state: "Jharkhand",
                country: "India",
                postalCode: "826001"
            }),
            state: "Jharkhand",
            district: "Dhanbad",
            imageId: "demo_image_id", // Placeholder
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
            const stateData = {
                ...reportData,
                lat: String(reportData.lat),
                lng: String(reportData.lng),
                issueTypeId: String(reportData.issueTypeId),
                upvotes: Number(reportData.upvotes)
            };

            // Remove fields not in state schema (based on previous scripts)
            delete stateData.gisData;
            delete stateData.reporterPhone;
            delete stateData.status; // State DB might not have status or uses different field? 
            // Checking upload-jharkhand-reports.js, it deletes status. 
            // Wait, if state DB is for analytics, it might need status. 
            // But I'll follow the template for safety to avoid schema errors.
            delete stateData.category;
            delete stateData.reporterName;
            delete stateData.userId;
            delete stateData.issueType; // Using issueTypeId now

            await databases.createDocument(
                STATE_DB_ID,
                TABLE_ID_JH_REPORTS,
                ID.unique(),
                stateData
            );

            successCount++;
        } catch (error) {
            console.error(`\nFailed to upload report ${i + 1}:`, error.message);
        }
    }

    console.log(`\n\nGeneration Complete! Successfully created ${successCount} reports.`);
}

generateReports();
