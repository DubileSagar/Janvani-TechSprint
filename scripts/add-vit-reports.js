import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = process.env.VITE_APPWRITE_TABLE_ID_REPORTS;

const STATE_DB_ID = '69306f670031d80567e0';
const TABLE_ID_AP_REPORTS = 'ap_reports';

const apiKey = process.argv[2];
if (!apiKey) {
    console.error("Please provide API Key");
    process.exit(1);
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

// VIT AP Coordinates
const CENTER = { lat: 16.4948, lng: 80.5007 };
const DISTRICT = "Guntur";
const STATE = "Andhra Pradesh";
const USER_NAME = "Sagar";
const USER_PHONE = "+919876543210";

const ISSUE_TYPES = [
    { id: "1", title: "Potholes & Road Damage" },
    { id: "2", title: "Street Lighting" },
    { id: "3", title: "Waste Management" },
    { id: "4", title: "Water & Sewage" },
    { id: "6", title: "Traffic & Safety" },
    { id: "16", title: "Utility Pole Fire/Electrical Hazard" }
];

const STATUSES = ["open", "in-progress", "resolved"];

function getRandomCoordinate(centerLat, centerLng) {
    const r = 0.005; // ~500m radius
    const lat = centerLat + (Math.random() - 0.5) * r * 2;
    const lng = centerLng + (Math.random() - 0.5) * r * 2;
    return { lat, lng };
}

async function addReports() {
    console.log("Adding 10 reports around VIT AP...");

    for (let i = 0; i < 10; i++) {
        const coords = getRandomCoordinate(CENTER.lat, CENTER.lng);
        const issue = ISSUE_TYPES[Math.floor(Math.random() * ISSUE_TYPES.length)];
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

        const reportData = {
            name: USER_NAME,
            reporterPhone: USER_PHONE,
            issueTitle: `${issue.title} near VIT AP`,
            description: `Reported issue at VIT AP Campus area. ${issue.title} needs attention.`,
            issueTypeId: issue.id,
            status: status,
            lat: coords.lat,
            lng: coords.lng,
            address: JSON.stringify({
                street: "Inavolu, Thullur Mandal",
                city: "Amaravati",
                district: DISTRICT,
                state: STATE,
                country: "India",
                postalCode: "522237"
            }),
            state: STATE,
            district: DISTRICT,
            imageId: "demo_image_id",
            upvotes: Math.floor(Math.random() * 100)
        };

        try {
            // 1. Main DB
            await databases.createDocument(
                DB_ID,
                TABLE_ID,
                ID.unique(),
                reportData,
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.any()), // Simplified for demo
                    Permission.delete(Role.any())
                ]
            );
            process.stdout.write('.');

            // 2. State DB (Clean payload)
            const stateData = { ...reportData };
            stateData.lat = String(stateData.lat);
            stateData.lng = String(stateData.lng);
            stateData.upvotes = Number(stateData.upvotes);

            delete stateData.reporterPhone;
            delete stateData.status;

            await databases.createDocument(
                STATE_DB_ID,
                TABLE_ID_AP_REPORTS,
                ID.unique(),
                stateData,
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any())
                ]
            );

        } catch (e) {
            console.error("\nError:", e.message);
        }
    }
    console.log("\nDone!");
}

addReports();
