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

const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID_AP_DISTRICTS = 'tb_ap_districts';
const TABLE_ID_JH_DISTRICTS = 'tb_jharkhand_districts';

async function checkAndFixDistricts() {
    try {
        console.log("Checking District Collections...");

        // 1. Check AP Districts
        console.log(`\n--- Checking ${TABLE_ID_AP_DISTRICTS} ---`);
        try {
            const apDocs = await databases.listDocuments(DB_ID, TABLE_ID_AP_DISTRICTS);
            console.log(`Found ${apDocs.total} documents.`);
            if (apDocs.documents.length > 0) {
                console.log("Sample:", apDocs.documents[0].name);
            } else {
                console.warn("⚠️ Collection is empty!");
            }
        } catch (e) {
            console.error("❌ Error reading documents:", e.message);
        }

        // 2. Fix Permissions (Just in case)
        console.log(`\nUpdating Permissions for ${TABLE_ID_AP_DISTRICTS}...`);
        await databases.updateCollection(
            DB_ID,
            TABLE_ID_AP_DISTRICTS,
            'AP Districts',
            [
                Permission.read(Role.any()), // Allow public read
                Permission.create(Role.any()), // Allow create (for script population)
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ]
        );
        console.log("✅ Permissions updated.");

        // 3. Fix Permissions for Jharkhand
        console.log(`\nUpdating Permissions for ${TABLE_ID_JH_DISTRICTS}...`);
        await databases.updateCollection(
            DB_ID,
            TABLE_ID_JH_DISTRICTS,
            'Jharkhand Districts',
            [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ]
        );
        console.log("✅ Permissions updated.");

    } catch (error) {
        console.error("❌ General Error:", error.message);
    }
}

checkAndFixDistricts();
