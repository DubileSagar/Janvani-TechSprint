import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = process.env.VITE_APPWRITE_TABLE_ID_REPORTS;

const STATE_DB_ID = '69306f670031d80567e0';
const TABLE_ID_AP_REPORTS = 'ap_reports';

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

// Valid Issue IDs (1-17)
const ISSUE_IDS = Array.from({ length: 17 }, (_, i) => String(i + 1));

async function fixIssueTypes() {
    try {
        console.log("Starting Issue Type Fix...");

        // 1. Fix Main DB
        await fixCollection(DB_ID, TABLE_ID, "Main DB");

        // 2. Fix State DB
        await fixCollection(STATE_DB_ID, TABLE_ID_AP_REPORTS, "State DB");

    } catch (e) {
        console.error("General Error:", e);
    }
}

async function fixCollection(dbId, tableId, label) {
    console.log(`\n--- Processing ${label} ---`);
    let cursor = null;
    let count = 0;

    while (true) {
        const queries = [
            Query.limit(100),
            Query.equal('issueTypeId', 'demo_type') // Only target demo types
        ];

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const docs = await databases.listDocuments(dbId, tableId, queries);

        if (docs.documents.length === 0) {
            console.log("No more 'demo_type' reports found.");
            break;
        }

        console.log(`Found ${docs.documents.length} docs to update...`);

        for (const doc of docs.documents) {
            const randomId = ISSUE_IDS[Math.floor(Math.random() * ISSUE_IDS.length)];

            // console.log(`Updating ${doc.$id} -> ${randomId}`);

            try {
                await databases.updateDocument(
                    dbId,
                    tableId,
                    doc.$id,
                    { issueTypeId: randomId }
                );
                process.stdout.write('.');
                count++;
            } catch (err) {
                console.error(`\nFailed to update ${doc.$id}:`, err.message);
            }
        }

        cursor = docs.documents[docs.documents.length - 1].$id;

        // If we fetched fewer than limit, we are done
        if (docs.documents.length < 100) break;
    }
    console.log(`\nUpdated ${count} documents in ${label}.`);
}

fixIssueTypes();
