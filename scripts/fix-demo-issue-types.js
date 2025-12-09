import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('692b234e002f52aa5dec'); // Project ID

const databases = new Databases(client);

// Configuration
const MAIN_DB_ID = '692b24770032935a55f9';
const MAIN_TABLE_ID = 'tb01';
const STATE_DB_ID = '69306f670031d80567e0';
const AP_TABLE_ID = 'ap_reports';
const JH_TABLE_ID = 'jharkhand_reports';

const civicIssues = [
    { id: 1, title: "Potholes & Road Damage" },
    { id: 2, title: "Street Lighting" },
    { id: 3, title: "Waste Management" },
    { id: 4, title: "Water & Sewage" },
    { id: 5, title: "Public Spaces" },
    { id: 6, title: "Traffic & Safety" },
    { id: 7, title: "Sidewalk Maintenance" },
    { id: 8, title: "Illegal Dumping" },
    { id: 9, title: "Graffiti & Vandalism" },
    { id: 10, title: "Abandoned Vehicles" },
    { id: 11, title: "Noise Complaints" },
    { id: 12, title: "Broken Playground Equipment" },
    { id: 13, title: "Fallen Trees" },
    { id: 14, title: "Flooding" },
    { id: 15, title: "Public Transport Issues" },
    { id: 16, title: "Utility Pole Fire/Electrical Hazard" },
    { id: 17, title: "Others" }
];

function getIssueTypeId(title) {
    if (!title) return 17; // Others

    const titleLower = title.toLowerCase();

    // 1. Exact Match
    const exact = civicIssues.find(i => i.title.toLowerCase() === titleLower);
    if (exact) return exact.id;

    // 2. Fuzzy Match
    const match = civicIssues.find(i => {
        const typeTitle = i.title.toLowerCase();
        if (titleLower.includes(typeTitle)) return true;

        if (typeTitle === 'water & sewage' && (titleLower.includes('water') || titleLower.includes('leak') || titleLower.includes('drain'))) return true;
        if (typeTitle === 'waste management' && (titleLower.includes('garbage') || titleLower.includes('trash') || titleLower.includes('dump'))) return true;
        if (typeTitle === 'street lighting' && (titleLower.includes('light') || titleLower.includes('dark'))) return true;
        if (typeTitle === 'potholes & road damage' && (titleLower.includes('pothole') || titleLower.includes('road'))) return true;
        if (typeTitle === 'traffic & safety' && (titleLower.includes('traffic') || titleLower.includes('accident'))) return true;
        if (typeTitle === 'public spaces' && (titleLower.includes('park') || titleLower.includes('bench'))) return true;
        if (typeTitle === 'others' && (titleLower.includes('stray') || titleLower.includes('animal'))) return true;

        return false;
    });

    return match ? match.id : 17; // Default to Others
}

async function fixCollection(dbId, tableId, name) {
    console.log(`\nProcessing ${name} (${dbId} / ${tableId})...`);
    let updatedCount = 0;

    try {
        // Fetch all documents (limit 100 for now, loop if needed but demo data is usually < 100 per batch)
        const response = await databases.listDocuments(
            dbId,
            tableId,
            [
                Query.limit(500),
                Query.orderDesc('$createdAt')
            ]
        );

        console.log(`Found ${response.documents.length} documents.`);

        for (const doc of response.documents) {
            // Check if it needs update: issueTypeId is 'demo_type' OR missing OR string 'undefined'
            if (doc.issueTypeId === 'demo_type' || !doc.issueTypeId || doc.issueTypeId === 'undefined') {

                const newTypeId = getIssueTypeId(doc.issueTitle);

                console.log(`Updating ${doc.$id}: "${doc.issueTitle}" -> Type ID ${newTypeId}`);

                await databases.updateDocument(
                    dbId,
                    tableId,
                    doc.$id,
                    {
                        issueTypeId: String(newTypeId) // Ensure string format
                    }
                );
                updatedCount++;
            }
        }

        console.log(`✅ Updated ${updatedCount} documents in ${name}.`);

    } catch (error) {
        console.error(`❌ Error processing ${name}:`, error.message);
    }
}

async function run() {
    console.log("Starting Database Fix...");

    await fixCollection(MAIN_DB_ID, MAIN_TABLE_ID, "Main Reports");
    await fixCollection(STATE_DB_ID, AP_TABLE_ID, "AP Reports");
    await fixCollection(STATE_DB_ID, JH_TABLE_ID, "Jharkhand Reports");

    console.log("\nAll Done!");
}

run();
