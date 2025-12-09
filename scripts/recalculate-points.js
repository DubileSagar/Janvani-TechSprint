import { Client, Databases, Query } from 'node-appwrite';
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

async function recalculatePoints() {
    console.log("🔄 Starting Points Recalculation...");

    try {
        // 1. List all users
        let allUsers = [];
        let offset = 0;
        let batch;

        do {
            batch = await databases.listDocuments(databaseId, TABLE_USER, [Query.limit(100), Query.offset(offset)]);
            allUsers = allUsers.concat(batch.documents);
            offset += 100;
        } while (batch.documents.length === 100);

        console.log(`Found ${allUsers.length} users.`);

        for (const user of allUsers) {
            const phone = user.phone;
            console.log(`Processing ${user.name || phone}...`);

            // Helper to handle phone variants (Manual here since we can't import db.js easily)
            const cleanPhone = String(phone).replace(/\D/g, '');
            const variants = [phone];
            if (cleanPhone.length > 0) variants.push(cleanPhone);
            if (cleanPhone.length === 10) variants.push(`+91${cleanPhone}`);
            if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
                variants.push(`+${cleanPhone}`);
                variants.push(cleanPhone.substring(2));
            }
            const uniqueVariants = [...new Set(variants)];

            // 2. Fetch all resolved reports for this user
            // We have to query for each variant separately
            let resolvedCount = 0;
            const processedIds = new Set();

            for (const v of uniqueVariants) {
                const reports = await databases.listDocuments(databaseId, TABLE_REPORTS, [
                    Query.equal('reporterPhone', v),
                    Query.equal('status', 'Resolved')
                ]);

                reports.documents.forEach(doc => {
                    if (!processedIds.has(doc.$id)) {
                        processedIds.add(doc.$id);
                        resolvedCount++;
                    }
                });
            }

            const expectedPoints = resolvedCount * 50;

            if (user.points !== expectedPoints) {
                console.log(`   > Fixing points: ${user.points} -> ${expectedPoints} (${resolvedCount} resolved issues)`);
                await databases.updateDocument(databaseId, TABLE_USER, user.$id, {
                    points: expectedPoints
                });
                console.log("   ✅ Updated.");
            } else {
                console.log(`   = Points correct (${expectedPoints})`);
            }
        }

        console.log("\n✨ Recalculation Complete!");

    } catch (error) {
        console.error("Error:", error);
    }
}

recalculatePoints();
