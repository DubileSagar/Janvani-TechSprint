import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const mainReportTableId = process.env.VITE_APPWRITE_TABLE_ID_REPORTS;
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

const AP_REPORTS_ID = 'tb_ap_reports';
const JH_REPORTS_ID = 'tb_jharkhand_reports';

// List of attributes to replicate from the main Reports table
// Based on what we know + new 'state' attribute
const ATTRIBUTES = [
    { key: 'issueTypeId', type: 'string', size: 255, required: false },
    { key: 'issueTitle', type: 'string', size: 255, required: false },
    { key: 'description', type: 'string', size: 5000, required: false }, // Assuming description exists
    { key: 'lat', type: 'string', size: 50, required: false }, // Storing as string usually
    { key: 'lng', type: 'string', size: 50, required: false },
    { key: 'address', type: 'string', size: 5000, required: false },
    { key: 'district', type: 'string', size: 100, required: false },
    { key: 'state', type: 'string', size: 100, required: false }, // New Attribute
    { key: 'gisData', type: 'string', size: 5000, required: false },
    { key: 'imageId', type: 'string', size: 255, required: false },
    { key: 'reporterName', type: 'string', size: 255, required: false },
    { key: 'reporterPhone', type: 'string', size: 50, required: false },
    { key: 'status', type: 'string', size: 50, required: false }, // open, resolved
    { key: 'upvotes', type: 'integer', required: false, default: 0 },
    { key: 'upvotedBy', type: 'string', size: 10000, required: false, array: true }, // Array of strings
];

async function setupStateTables() {
    try {
        console.log("Starting State Reports Tables Setup...");

        // 1. Update Main Reports Table (Add 'state')
        console.log(`Updating Main Reports Table (${mainReportTableId})...`);
        try {
            await databases.createStringAttribute(databaseId, mainReportTableId, 'state', 100, false);
            console.log("✅ Added 'state' attribute to Main Reports.");
        } catch (e) {
            console.log(`ℹ️ 'state' attribute: ${e.message}`);
        }

        // 2. Create AP Reports Table
        await createAndConfigureTable(AP_REPORTS_ID, 'AP Reports');

        // 3. Create Jharkhand Reports Table
        await createAndConfigureTable(JH_REPORTS_ID, 'Jharkhand Reports');

        console.log("✅ All State Report Tables Setup Complete.");

    } catch (error) {
        console.error("❌ General Error:", error);
    }
}

async function createAndConfigureTable(tableId, tableName) {
    console.log(`\n--- Processing ${tableName} (${tableId}) ---`);

    // 1. Create Collection
    try {
        await databases.createCollection(databaseId, tableId, tableName);
        console.log(`✅ Created Collection: ${tableName}`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Collection ${tableName} already exists.`);
        } else {
            console.error(`❌ Failed to create collection ${tableName}:`, e.message);
            return;
        }
    }

    // 2. Create Attributes
    for (const attr of ATTRIBUTES) {
        try {
            if (attr.type === 'string') {
                await databases.createStringAttribute(databaseId, tableId, attr.key, attr.size, attr.required, attr.default, attr.array);
            } else if (attr.type === 'integer') {
                await databases.createIntegerAttribute(databaseId, tableId, attr.key, attr.required, 0, 999999999, attr.default, attr.array);
            }
            console.log(`   + Added attribute: ${attr.key}`);
            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            if (e.code === 409) {
                // console.log(`   ℹ️ Attribute ${attr.key} already exists.`);
            } else {
                console.error(`   - Failed to add attribute ${attr.key}:`, e.message);
            }
        }
    }
}

setupStateTables();
