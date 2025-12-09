import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = process.env.VITE_APPWRITE_TABLE_ID_REPORTS;

async function inspectReports() {
    try {
        console.log('Fetching reports...');
        const response = await databases.listDocuments(
            DATABASE_ID,
            TABLE_ID,
            [
                Query.orderDesc('$createdAt'),
                Query.limit(5)
            ]
        );

        console.log(`Fetched ${response.documents.length} reports.`);

        response.documents.forEach(report => {
            console.log('---------------------------------------------------');
            console.log(`ID: ${report.$id}`);
            console.log(`Title: ${report.issueTitle}`);
            console.log(`Issue Type ID: ${report.issueTypeId} (Type: ${typeof report.issueTypeId})`);
            console.log(`Issue Type (Legacy): ${report.issueType}`);
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
    }
}

inspectReports();
