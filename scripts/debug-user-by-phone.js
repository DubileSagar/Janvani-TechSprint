import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();
client.setEndpoint(process.env.VITE_APPWRITE_ENDPOINT).setProject(process.env.VITE_APPWRITE_PROJECT_ID).setKey(process.argv[2]);
const databases = new Databases(client);
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID_USERS = 'tb_users';

// Phone number from the seeding log that failed (User's likely number)
const PHONE = '+917588348800';

async function debugUser() {
    console.log(`🔎 Debugging User: ${PHONE}`);
    const cleanPhone = String(PHONE).replace(/\D/g, '');
    const variants = [cleanPhone, `+91${cleanPhone}`, PHONE];
    const unique = [...new Set(variants)];
    console.log("Checking variants:", unique);

    for (const p of unique) {
        const res = await databases.listDocuments(DB_ID, TABLE_ID_USERS, [Query.equal('phone', p)]);
        console.log(`Query '${p}': Found ${res.total} docs.`);
        res.documents.forEach(d => {
            console.log(`   - ID: ${d.$id}`);
            console.log(`   - Phone: ${d.phone}`);
            console.log(`   - Points: ${d.points}`);
            console.log(`   - Name: ${d.name}`);
            console.log("---");
        });
    }
}

debugUser();
