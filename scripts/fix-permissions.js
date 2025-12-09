import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();
client.setEndpoint(process.env.VITE_APPWRITE_ENDPOINT).setProject(process.env.VITE_APPWRITE_PROJECT_ID).setKey(process.argv[2]);
const databases = new Databases(client);
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID_USERS = 'tb_users';

async function fixPermissions() {
    console.log("🔐 Updating Collection Permissions...");
    try {
        await databases.updateCollection(
            DB_ID,
            TABLE_ID_USERS,
            'Users Data',
            [
                Permission.read(Role.any()), // Allow public read (Guest) - Needed since we use Supabase Auth
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ]
        );
        console.log("✅ Permissions Updated: Public Read/Write enabled for tb_users.");
    } catch (error) {
        console.error("Error updating permissions:", error);
    }
}

fixPermissions();
