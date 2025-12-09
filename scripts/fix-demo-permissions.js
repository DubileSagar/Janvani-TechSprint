import { Client, Databases, Permission, Role, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = process.env.VITE_APPWRITE_TABLE_ID_REPORTS;

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

async function fixPermissions() {
    try {
        console.log("Fetching all reports...");
        // Fetch all (pagination loop if needed, but let's start with first 100)
        const response = await databases.listDocuments(DB_ID, TABLE_ID, [
            // Query.limit(100) // Default is 25
        ]);

        // We need to loop to get all if > 25.
        // But listDocuments default limit is 25. Max is 100.
        // Let's use a loop.

        let cursor = null;
        let count = 0;

        while (true) {
            const queries = [Query.limit(100)];
            if (cursor) {
                queries.push(Query.cursorAfter(cursor));
            }

            const docs = await databases.listDocuments(DB_ID, TABLE_ID, queries);

            if (docs.documents.length === 0) break;

            console.log(`Found ${docs.documents.length} docs. Updating permissions...`);

            for (const doc of docs.documents) {
                console.log(`Updating ${doc.$id}...`);
                await databases.updateDocument(
                    DB_ID,
                    TABLE_ID,
                    doc.$id,
                    {},
                    [
                        Permission.read(Role.any()),
                        Permission.update(Role.user(doc.userId || '692b2aab001413c581ba')),
                        Permission.delete(Role.user(doc.userId || '692b2aab001413c581ba')),
                    ]
                );
                count++;
            }

            cursor = docs.documents[docs.documents.length - 1].$id;

            // If we fetched fewer than limit, we are done
            if (docs.documents.length < 100) break;
        }

        console.log(`Updated permissions for ${count} documents.`);

    } catch (e) {
        console.error("Error:", e);
    }
}

fixPermissions();
