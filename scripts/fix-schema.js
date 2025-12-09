import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const collectionId = process.env.VITE_APPWRITE_TABLE_ID_REPORTS;
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

async function fixSchema() {
    try {
        console.log(`Checking/Adding attributes for Collection: ${collectionId}...`);

        // issueTypeId
        try {
            await databases.createStringAttribute(databaseId, collectionId, 'issueTypeId', 255, false);
            console.log("✅ Added 'issueTypeId' attribute.");
        } catch (e) {
            console.log(`ℹ️ 'issueTypeId': ${e.message}`);
        }

        // issueTitle
        try {
            await databases.createStringAttribute(databaseId, collectionId, 'issueTitle', 255, false);
            console.log("✅ Added 'issueTitle' attribute.");
        } catch (e) {
            console.log(`ℹ️ 'issueTitle': ${e.message}`);
        }

        // address
        try {
            await databases.createStringAttribute(databaseId, collectionId, 'address', 5000, false);
            console.log("✅ Added 'address' attribute.");
        } catch (e) {
            console.log(`ℹ️ 'address': ${e.message}`);
        }

        // district
        try {
            await databases.createStringAttribute(databaseId, collectionId, 'district', 100, false);
            console.log("✅ Added 'district' attribute.");
        } catch (e) {
            console.log(`ℹ️ 'district': ${e.message}`);
        }

        // gisData
        try {
            await databases.createStringAttribute(databaseId, collectionId, 'gisData', 5000, false);
            console.log("✅ Added 'gisData' attribute.");
        } catch (e) {
            console.log(`ℹ️ 'gisData': ${e.message}`);
        }

        // resolutionImageId
        try {
            await databases.createStringAttribute(databaseId, collectionId, 'resolutionImageId', 100, false);
            console.log("✅ Added 'resolutionImageId' attribute.");
        } catch (e) {
            console.log(`ℹ️ 'resolutionImageId': ${e.message}`);
        }

        // resolutionNote
        try {
            await databases.createStringAttribute(databaseId, collectionId, 'resolutionNote', 1000, false);
            console.log("✅ Added 'resolutionNote' attribute.");
        } catch (e) {
            console.log(`ℹ️ 'resolutionNote': ${e.message}`);
        }

        console.log("Schema update for Reports finished.");

        // --- Users Collection ---
        const usersCollectionId = 'tb_users'; // Hardcoded ID for users
        console.log(`Checking/Creating Users Collection: ${usersCollectionId}...`);

        try {
            await databases.createCollection(databaseId, usersCollectionId, 'Users');
            console.log("✅ Created 'Users' collection.");
        } catch (e) {
            console.log(`ℹ️ Collection 'Users': ${e.message}`);
        }

        // phone
        try {
            await databases.createStringAttribute(databaseId, usersCollectionId, 'phone', 20, true);
            console.log("✅ Added 'phone' attribute to Users.");
        } catch (e) {
            console.log(`ℹ️ 'phone': ${e.message}`);
        }

        // name
        try {
            await databases.createStringAttribute(databaseId, usersCollectionId, 'name', 100, false);
            console.log("✅ Added 'name' attribute to Users.");
        } catch (e) {
            console.log(`ℹ️ 'name': ${e.message}`);
        }

        console.log("All schema updates finished.");
    } catch (error) {
        console.error("❌ General error:", error.message);
    }
}

fixSchema();
