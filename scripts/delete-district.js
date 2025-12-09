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

const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID_AP_DISTRICTS = 'tb_ap_districts';
const DELETE_ID = '69307d8d00321118cc3c'; // YSR

async function deleteDistrict() {
    try {
        console.log(`Deleting district ${DELETE_ID}...`);
        await databases.deleteDocument(DB_ID, TABLE_ID_AP_DISTRICTS, DELETE_ID);
        console.log("✅ Deleted successfully.");
    } catch (error) {
        console.error("Error:", error.message);
    }
}

deleteDistrict();
