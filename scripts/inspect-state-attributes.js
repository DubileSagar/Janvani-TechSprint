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

const STATE_DB_ID = '69306f670031d80567e0';
const AP_REPORTS_ID = 'ap_reports';

async function inspectAttributes() {
    try {
        console.log(`Inspecting attributes for ${AP_REPORTS_ID}...`);
        const response = await databases.listAttributes(STATE_DB_ID, AP_REPORTS_ID);

        console.log(`Total Attributes: ${response.total}`);
        response.attributes.forEach(attr => {
            console.log(`- ${attr.key} (${attr.type}, ${attr.size || 'N/A'})`);
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

inspectAttributes();
