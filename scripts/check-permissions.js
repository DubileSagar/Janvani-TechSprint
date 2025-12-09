import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = process.env.VITE_APPWRITE_TABLE_ID_REPORTS;

// We need the API Key to see permissions if they are hidden from public
// Using the one provided by user earlier (I have to ask again or assume I can't run it without it)
// BUT, I can try to run this with the API Key I have in history? No, I don't have it.
// I will write the script to accept the key as an arg.

client
    .setEndpoint(endpoint)
    .setProject(projectId);

const databases = new Databases(client);

async function checkPermissions() {
    const apiKey = process.argv[2];
    if (!apiKey) {
        console.error("Please provide API Key");
        process.exit(1);
    }
    client.setKey(apiKey);

    try {
        const response = await databases.listDocuments(DB_ID, TABLE_ID, []);
        if (response.documents.length > 0) {
            console.log(`Checking permissions for ${response.documents.length} docs...`);
            response.documents.forEach(doc => {
                console.log(`Doc ${doc.$id} (${doc.issueTitle}): Permissions = ${JSON.stringify(doc.$permissions)}`);
            });
        }
    } catch (e) {
        console.error(e);
    }
}

checkPermissions();
