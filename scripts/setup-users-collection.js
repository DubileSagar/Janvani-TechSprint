import { Client, Databases, Users, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
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
const users = new Users(client);

const TABLE_USER = 'tb_users';

async function setupUsersCollection() {
    try {
        console.log("🚀 Starting Users Collection Setup...");

        // 1. Create Collection if not exists
        try {
            await databases.getCollection(databaseId, TABLE_USER);
            console.log(`✅ Collection ${TABLE_USER} already exists.`);
        } catch (e) {
            console.log(`Creating collection ${TABLE_USER}...`);
            await databases.createCollection(databaseId, TABLE_USER, 'Users Data');
            console.log(`✅ Created collection ${TABLE_USER}`);
        }

        // 2. Add Attributes
        const attributes = [
            { key: 'phone', type: 'string', size: 50, required: true },
            { key: 'name', type: 'string', size: 255, required: false },
            { key: 'email', type: 'string', size: 255, required: false },
            { key: 'points', type: 'integer', required: false, default: 0 },
            { key: 'state', type: 'string', size: 100, required: false },
            { key: 'district', type: 'string', size: 100, required: false },
            { key: 'age', type: 'string', size: 10, required: false }, // Use string for flexibility or integer
            { key: 'gender', type: 'string', size: 20, required: false },
            { key: 'isProfileComplete', type: 'boolean', required: false, default: false }
        ];

        for (const attr of attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(databaseId, TABLE_USER, attr.key, attr.size, attr.required, undefined, false);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(databaseId, TABLE_USER, attr.key, attr.required, 0, 9999999, attr.default, false);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(databaseId, TABLE_USER, attr.key, attr.required, attr.default, false);
                }
                console.log(`   + Added attribute: ${attr.key}`);
                await new Promise(r => setTimeout(r, 500)); // Rate limit buffer
            } catch (e) {
                // Ignore if already exists
                if (e.code !== 409) console.log(`   - Attribute ${attr.key} skipped/failed: ${e.message}`);
                else console.log(`   = Attribute ${attr.key} exists.`);
            }
        }

        // Wait for attributes to index (approx)
        console.log("⏳ Waiting for attributes to process...");
        await new Promise(r => setTimeout(r, 2000));

        // 3. Migrate Auth Users -> DB Users
        console.log("\n🔄 Starting User Migration...");
        const authUsers = await users.list();
        console.log(`Found ${authUsers.total} users in Auth.`);

        for (const user of authUsers.users) {
            try {
                // Check if user already in DB by phone
                const phone = user.phone;
                if (!phone) {
                    console.log(`   Unknown user (no phone), skipping: ${user.$id}`);
                    continue;
                }

                const existing = await databases.listDocuments(
                    databaseId,
                    TABLE_USER,
                    [Query.equal('phone', phone)]
                );

                if (existing.documents.length === 0) {
                    // Create
                    console.log(`   + Creating DB record for: ${user.name || phone}`);
                    await databases.createDocument(
                        databaseId,
                        TABLE_USER,
                        user.$id, // Use same ID as Auth for consistency
                        {
                            phone: user.phone,
                            name: user.name || 'Citizen',
                            email: user.email || '',
                            points: 0,
                            // Try to parse prefs if any
                            state: user.prefs?.state || '',
                            district: user.prefs?.district || '',
                            isProfileComplete: !!user.name
                        }
                    );
                } else {
                    console.log(`   = User already in DB: ${user.name || phone}`);
                    // Optional: Update points if missing?
                    const doc = existing.documents[0];
                    if (doc.points === undefined || doc.points === null) {
                        await databases.updateDocument(databaseId, TABLE_USER, doc.$id, { points: 0 });
                        console.log(`     > Patched points to 0`);
                    }
                }

            } catch (err) {
                console.error(`   ! Failed to migrate user ${user.$id}:`, err.message);
            }
        }

        console.log("\n✅ Setup & Migration Complete!");

    } catch (error) {
        console.error("❌ Fatal Error:", error);
    }
}

setupUsersCollection();
