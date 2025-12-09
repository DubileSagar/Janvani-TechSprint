import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.argv[2];

if (!apiKey) {
    console.error("Error: Please provide your Appwrite API Key as an argument.");
    process.exit(1);
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

const STATE_DB_ID = '69306f670031d80567e0';
const AP_REPORTS_ID = 'ap_reports';
const JH_REPORTS_ID = 'jharkhand_reports';

async function swapAttributes() {
    try {
        console.log("Swapping 'gisData' for 'name' in State Collections...");

        // 1. AP Reports
        console.log(`Processing ${AP_REPORTS_ID}...`);
        try {
            await databases.deleteAttribute(STATE_DB_ID, AP_REPORTS_ID, 'gisData');
            console.log("✅ Deleted 'gisData' from AP Reports.");
            // Wait for deletion to propagate
            await new Promise(r => setTimeout(r, 2000));
            await databases.createStringAttribute(STATE_DB_ID, AP_REPORTS_ID, 'name', 255, false);
            console.log("✅ Added 'name' to AP Reports.");
        } catch (e) {
            console.log(`ℹ️ AP Reports Error: ${e.message}`);
        }

        // 2. Jharkhand Reports
        console.log(`Processing ${JH_REPORTS_ID}...`);
        try {
            await databases.deleteAttribute(STATE_DB_ID, JH_REPORTS_ID, 'gisData');
            console.log("✅ Deleted 'gisData' from Jharkhand Reports.");
            // Wait for deletion to propagate
            await new Promise(r => setTimeout(r, 2000));
            await databases.createStringAttribute(STATE_DB_ID, JH_REPORTS_ID, 'name', 255, false);
            console.log("✅ Added 'name' to Jharkhand Reports.");
        } catch (e) {
            console.log(`ℹ️ Jharkhand Reports Error: ${e.message}`);
        }

    } catch (error) {
        console.error("❌ General Error:", error.message);
    }
}

swapAttributes();
