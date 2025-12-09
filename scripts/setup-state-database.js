import { Client, Databases, ID } from 'node-appwrite';
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

const NEW_DB_NAME = 'StateReportsDB';
const AP_REPORTS_ID = 'ap_reports';
const JH_REPORTS_ID = 'jharkhand_reports';

// Schema attributes to replicate
const ATTRIBUTES = [
    { key: 'issueTypeId', type: 'string', size: 255, required: false },
    { key: 'issueTitle', type: 'string', size: 255, required: false },
    { key: 'description', type: 'string', size: 5000, required: false },
    { key: 'lat', type: 'string', size: 50, required: false },
    { key: 'lng', type: 'string', size: 50, required: false },
    { key: 'address', type: 'string', size: 5000, required: false },
    { key: 'district', type: 'string', size: 100, required: false },
    { key: 'state', type: 'string', size: 100, required: false },
    { key: 'gisData', type: 'string', size: 5000, required: false },
    { key: 'imageId', type: 'string', size: 255, required: false },
    { key: 'reporterName', type: 'string', size: 255, required: false },
    { key: 'reporterPhone', type: 'string', size: 50, required: false },
    { key: 'status', type: 'string', size: 50, required: false },
    { key: 'upvotes', type: 'integer', required: false, default: 0 },
    { key: 'upvotedBy', type: 'string', size: 10000, required: false, array: true },
];

async function setupStateDatabase() {
    try {
        console.log("Starting State Database Setup...");

        // 1. Create New Database
        let newDbId;
        try {
            const db = await databases.create(ID.unique(), NEW_DB_NAME);
            newDbId = db.$id;
            console.log(`✅ Created New Database: ${NEW_DB_NAME} (ID: ${newDbId})`);
            console.log(`!!! IMPORTANT: SAVE THIS DATABASE ID !!!`);
        } catch (e) {
            console.error(`❌ Failed to create database:`, e.message);
            return;
        }

        // 2. Create AP Reports Collection
        await createAndConfigureTable(newDbId, AP_REPORTS_ID, 'AP Reports');

        // 3. Create Jharkhand Reports Collection
        await createAndConfigureTable(newDbId, JH_REPORTS_ID, 'Jharkhand Reports');

        console.log("\n✅ All State Database Setup Complete.");
        console.log(`\nPLEASE UPDATE YOUR CODE WITH:`);
        console.log(`const STATE_DB_ID = '${newDbId}';`);

    } catch (error) {
        console.error("❌ General Error:", error);
    }
}

async function createAndConfigureTable(databaseId, tableId, tableName) {
    console.log(`\n--- Processing ${tableName} (${tableId}) in DB ${databaseId} ---`);

    // 1. Create Collection
    try {
        await databases.createCollection(databaseId, tableId, tableName);
        console.log(`✅ Created Collection: ${tableName}`);
    } catch (e) {
        console.error(`❌ Failed to create collection ${tableName}:`, e.message);
        return;
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
            // Small delay
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.error(`   - Failed to add attribute ${attr.key}:`, e.message);
        }
    }
}

setupStateDatabase();
