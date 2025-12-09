import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import { supportedLocations } from '../src/data/states-cities.js';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
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

const AP_TABLE_ID = 'tb_ap_districts';
const JH_TABLE_ID = 'tb_jharkhand_districts';

async function setupTables() {
    try {
        console.log("Starting District Tables Setup...");

        // 1. Create AP Districts Table
        await createAndPopulateTable(AP_TABLE_ID, 'AP Districts', supportedLocations["Andhra Pradesh"]);

        // 2. Create Jharkhand Districts Table
        await createAndPopulateTable(JH_TABLE_ID, 'Jharkhand Districts', supportedLocations["Jharkhand"]);

        console.log("✅ All District Tables Setup Complete.");

    } catch (error) {
        console.error("❌ General Error:", error);
    }
}

async function createAndPopulateTable(tableId, tableName, districtData) {
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

    // 2. Create 'name' Attribute
    try {
        await databases.createStringAttribute(databaseId, tableId, 'name', 100, true);
        console.log(`✅ Created 'name' attribute in ${tableName}`);
        // Wait for attribute to be available
        console.log("Waiting for attribute to be available...");
        await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Attribute 'name' already exists.`);
        } else {
            console.error(`❌ Failed to create attribute 'name':`, e.message);
        }
    }

    // 3. Populate Data
    const districts = Object.keys(districtData);
    console.log(`Populating ${districts.length} districts...`);

    for (const districtName of districts) {
        try {
            await databases.createDocument(
                databaseId,
                tableId,
                ID.unique(),
                { name: districtName }
            );
            console.log(`   + Added: ${districtName}`);
        } catch (e) {
            console.error(`   - Failed to add ${districtName}:`, e.message);
        }
    }
}

setupTables();
