import { Client, Databases, Query, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();
const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const apiKey = process.argv[2];

if (!apiKey) {
    console.error("Please provide API Key");
    process.exit(1);
}

client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

const TABLE_USER = 'tb_users';
const TABLE_REPORTS = process.env.VITE_APPWRITE_TABLE_ID_REPORTS;

async function seedAndRecalculate() {
    console.log("🌱 Starting User Seeding from Reports...");

    try {
        // 1. Fetch all reports to find unique phone numbers
        let allReports = [];
        let offset = 0;
        let batch;

        do {
            batch = await databases.listDocuments(databaseId, TABLE_REPORTS, [Query.limit(50), Query.offset(offset)]);
            allReports = allReports.concat(batch.documents);
            offset += 50;
            console.log(`   Fetched ${allReports.length} reports...`);
            await new Promise(r => setTimeout(r, 500)); // Delay to prevent timeout
        } while (batch.documents.length === 50);

        console.log(`Scanned ${allReports.length} reports.`);

        // Group by phone
        const phoneMap = {}; // phone -> { name: string, resolvedCount: number }

        for (const report of allReports) {
            const phone = report.reporterPhone;
            if (!phone) continue;

            if (!phoneMap[phone]) {
                phoneMap[phone] = { name: report.name || 'Citizen', resolvedCount: 0 };
            }

            if (report.status === 'Resolved') {
                phoneMap[phone].resolvedCount++;
            }
        }

        const uniquePhones = Object.keys(phoneMap);
        console.log(`Found ${uniquePhones.length} unique reporters.`);

        // 2. Ensure User Exists & Update Points
        for (const phone of uniquePhones) {
            const data = phoneMap[phone];
            const expectedPoints = data.resolvedCount * 50;

            console.log(`Processing ${phone} (${data.resolvedCount} resolved)...`);

            // Check if user exists (using simple query first)
            // Ideally we'd use the robust check, but for seeding we'll try direct match first
            // If they signed up with +91, but report has 98..., we might create a duplicate if we aren't careful.
            // But since we are seeding FROM reports, we are creating the user matching the report key.

            const users = await databases.listDocuments(databaseId, TABLE_USER, [Query.equal('phone', phone)]);

            if (users.documents.length === 0) {
                console.log(`   + Creating new user for ${phone}`);
                await databases.createDocument(databaseId, TABLE_USER, ID.unique(), {
                    phone: phone,
                    name: data.name,
                    points: expectedPoints,
                    isProfileComplete: false
                });
            } else {
                const user = users.documents[0];
                if (user.points !== expectedPoints) {
                    console.log(`   > Updating points: ${user.points} -> ${expectedPoints}`);
                    await databases.updateDocument(databaseId, TABLE_USER, user.$id, {
                        points: expectedPoints
                    });
                } else {
                    console.log(`   = Points synced.`);
                }
            }
        }

        console.log("\n✨ Seeding & Recalculation Complete!");

    } catch (error) {
        console.error("Error:", error);
    }
}

seedAndRecalculate();
