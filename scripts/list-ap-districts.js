import { Client, Databases, Query } from 'node-appwrite';
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

async function listDistricts() {
    try {
        const response = await databases.listDocuments(
            DB_ID,
            TABLE_ID_AP_DISTRICTS,
            [Query.limit(100), Query.orderAsc('name')]
        );

        console.log(`Total Districts: ${response.total}`);
        response.documents.forEach(doc => {
            console.log(`- ${doc.name} (ID: ${doc.$id})`);
        });

    } catch (error) {
        console.error("Error:", error.message);
    }
}

listDistricts();
