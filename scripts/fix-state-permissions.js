import { Client, Databases, Permission, Role } from 'node-appwrite';
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

// IDs from previous steps
const STATE_DB_ID = '69306f670031d80567e0';
const AP_REPORTS_ID = 'ap_reports';
const JH_REPORTS_ID = 'jharkhand_reports';

async function fixPermissions() {
    try {
        console.log("Updating Permissions for State Collections...");

        // Define Permissions: Allow 'any' to read, 'users' (authenticated) to create/update/delete
        // Or for simplicity in this prototype: role:all for read, role:all for create (if anonymous allowed)
        // Adjust based on your auth model. Assuming authenticated users report.

        const permissions = [
            Permission.read(Role.any()),
            Permission.create(Role.any()), // Allow anyone to create for now (or Role.users())
            Permission.update(Role.any()),
            Permission.delete(Role.any())
        ];

        // 1. Update AP Reports
        console.log(`Updating ${AP_REPORTS_ID}...`);
        await databases.updateCollection(
            STATE_DB_ID,
            AP_REPORTS_ID,
            'AP Reports',
            permissions
        );
        console.log("✅ Permissions updated for AP Reports.");

        // 2. Update Jharkhand Reports
        console.log(`Updating ${JH_REPORTS_ID}...`);
        await databases.updateCollection(
            STATE_DB_ID,
            JH_REPORTS_ID,
            'Jharkhand Reports',
            permissions
        );
        console.log("✅ Permissions updated for Jharkhand Reports.");

    } catch (error) {
        console.error("❌ Error updating permissions:", error.message);
    }
}

fixPermissions();
