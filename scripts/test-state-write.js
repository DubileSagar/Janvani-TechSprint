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

const STATE_DB_ID = '69306f670031d80567e0';
const AP_REPORTS_ID = 'ap_reports';

async function testWrite() {
    try {
        console.log("Testing write to AP Reports...");

        // Simulate the payload we are sending from frontend (excluding the fields we removed)
        const data = {
            issueTypeId: "1",
            issueTitle: "Test Issue",
            description: "This is a test description",
            lat: "16.5062",
            lng: "80.6480",
            address: "Vijayawada, Andhra Pradesh",
            district: "Krishna",
            state: "Andhra Pradesh",
            // gisData: removed
            imageId: "test_image_id",
            // reporterName: removed
            // reporterPhone: removed
            // status: removed
            upvotes: 0,
            upvotedBy: [],
            name: "Test User" // Added this back
        };

        const response = await databases.createDocument(
            STATE_DB_ID,
            AP_REPORTS_ID,
            ID.unique(),
            data
        );

        console.log("✅ Write Successful!", response.$id);

    } catch (error) {
        console.error("❌ Write Failed:", error.message);
        console.error("Error Details:", error);
    }
}

testWrite();
