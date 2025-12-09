import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('692b234e002f52aa5dec'); // Project ID from .env

const databases = new Databases(client);

const DB_ID = '692b24770032935a55f9'; // Database ID from .env
const TABLE_ID = 'tb01'; // Reports Table ID from .env

async function debugReports() {
    try {
        console.log("Fetching recent reports...");
        const response = await databases.listDocuments(
            DB_ID,
            TABLE_ID,
            [
                Query.limit(100),
                Query.orderDesc('$createdAt')
            ]
        );

        console.log(`Fetched ${response.documents.length} reports.`);

        const dhanbadReports = response.documents.filter(doc =>
            (doc.district && doc.district.toLowerCase().includes('dhanbad')) ||
            (doc.address && doc.address.toLowerCase().includes('dhanbad'))
        );

        console.log(`Found ${dhanbadReports.length} reports related to Dhanbad.`);

        if (dhanbadReports.length > 0) {
            console.log("\nSample Dhanbad Reports:");
            dhanbadReports.slice(0, 5).forEach(doc => {
                console.log(`- ID: ${doc.$id}`);
                console.log(`  Title: ${doc.issueTitle}`);
                console.log(`  Type ID: ${doc.issueTypeId} (Type: ${typeof doc.issueTypeId})`);
                console.log(`  District: ${doc.district}`);
                console.log(`  Status: ${doc.status}`);
                console.log(`  Coords: ${doc.lat}, ${doc.lng}`);
                console.log("---");
            });
        } else {
            console.log("No Dhanbad reports found in the last 100 entries.");
        }

        // Check for Issue Type ID consistency across all reports
        console.log("\nChecking Issue Type IDs:");
        const issueTypes = {};
        response.documents.forEach(doc => {
            const type = doc.issueTypeId || 'undefined';
            issueTypes[type] = (issueTypes[type] || 0) + 1;
        });
        console.table(issueTypes);

    } catch (error) {
        console.error("Error fetching reports:", error);
    }
}

debugReports();
