import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
// We need an API Key to list attributes if we want to be sure, 
// but we can also just try to list documents and see what fields they have.
// Using the key provided by user earlier if possible, or just listing documents with read access (if public).
// Actually, listing attributes requires API Key. Listing documents might be enough.

const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = process.env.VITE_APPWRITE_TABLE_ID_REPORTS;

client
    .setEndpoint(endpoint)
    .setProject(projectId);

const databases = new Databases(client);

async function inspect() {
    try {
        console.log(`Fetching documents from DB: ${DB_ID}, Table: ${TABLE_ID}`);
        const response = await databases.listDocuments(
            DB_ID,
            TABLE_ID,
            [] // No queries, just get latest
        );

        if (response.documents.length > 0) {
            const doc = response.documents[0];
            console.log("First Document Structure:");
            console.log(JSON.stringify(doc, null, 2));

            console.log("\nChecking for lat/lng:");
            console.log(`lat: ${doc.lat} (${typeof doc.lat})`);
            console.log(`lng: ${doc.lng} (${typeof doc.lng})`);
            console.log(`coords: ${doc.coords} (${typeof doc.coords})`);
        } else {
            console.log("No documents found.");
        }
    } catch (error) {
        console.error("Error fetching documents:", error);
    }
}

inspect();
