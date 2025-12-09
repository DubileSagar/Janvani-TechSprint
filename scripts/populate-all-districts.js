import { Client, Databases, ID, Query } from 'node-appwrite';
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

const AP_DISTRICTS = [
    "Alluri Sitharama Raju", "Anakapalli", "Anantapur", "Annamayya", "Bapatla",
    "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur",
    "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu",
    "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai",
    "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR"
];

const JH_DISTRICTS = [
    "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum",
    "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara",
    "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu",
    "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"
];

async function populateDistricts(tableId, fullList, stateName) {
    console.log(`\n--- Populating ${stateName} Districts ---`);
    try {
        // 1. Get existing districts
        let existingNames = new Set();
        let cursor = null;

        do {
            const queries = [Query.limit(100)];
            if (cursor) queries.push(Query.cursorAfter(cursor));

            const response = await databases.listDocuments(DB_ID, tableId, queries);
            response.documents.forEach(doc => existingNames.add(doc.name.toLowerCase()));

            if (response.documents.length > 0) {
                cursor = response.documents[response.documents.length - 1].$id;
            } else {
                cursor = null;
            }

            if (response.documents.length < 100) cursor = null; // End of list

        } while (cursor);

        console.log(`Found ${existingNames.size} existing districts.`);

        // 2. Add missing districts
        let addedCount = 0;
        for (const district of fullList) {
            if (!existingNames.has(district.toLowerCase())) {
                try {
                    await databases.createDocument(
                        DB_ID,
                        tableId,
                        ID.unique(),
                        { name: district }
                    );
                    console.log(`+ Added: ${district}`);
                    addedCount++;
                    // Small delay to avoid rate limits
                    await new Promise(r => setTimeout(r, 100));
                } catch (e) {
                    console.error(`- Failed to add ${district}:`, e.message);
                }
            }
        }

        console.log(`✅ Finished. Added ${addedCount} new districts.`);

    } catch (error) {
        console.error(`❌ Error processing ${stateName}:`, error.message);
    }
}

async function run() {
    await populateDistricts(TABLE_ID_AP_DISTRICTS, AP_DISTRICTS, "Andhra Pradesh");
    await populateDistricts(TABLE_ID_JH_DISTRICTS, JH_DISTRICTS, "Jharkhand");
}

run();
