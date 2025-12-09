# Appwrite Setup Instructions

This project has been updated to use **Appwrite** for Authentication and Database. Follow these steps to set up your Appwrite backend.

## 1. Create Appwrite Project
1. Go to your [Appwrite Console](https://cloud.appwrite.io/console).
2. Create a new project (e.g., "Citizen Connect").
3. Copy the **Project ID** and **API Endpoint**.

## 2. Configure Environment Variables
1. Open the `.env` file in the project root.
2. Update the following variables:
   ```env
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_DATABASE_ID=your_database_id
   VITE_APPWRITE_TABLE_ID_REPORTS=your_table_id
   ```

## 3. Setup Authentication
1. In Appwrite Console, go to **Auth** > **Settings**.
2. Enable **Phone** provider.
3. Enable **Google** provider (requires Google Cloud Console Client ID/Secret).
4. Enable **Apple** provider (requires Apple Developer Service ID).
5. Go to **Overview** > **Platforms** > **Add Platform** > **Web App**.
   - Name: `Citizen Connect`
   - Hostname: `localhost` (and your production domain)

## 4. Setup Database
1. Go to **Databases**.
2. Create a new Database (e.g., `citizen_db`). Copy the **Database ID**.
3. Create a new **Table** (formerly Collection) (e.g., `reports`). Copy the **Table ID**.
4. **Create Columns** (formerly Attributes):
   - `name` (String, size: 128, required: true)
   - `issueType` (String, size: 32, required: false)
   - `issueTitle` (String, size: 128, required: true)
   - `description` (String, size: 1000, required: false)
   - `lat` (Float, required: true)
   - `lng` (Float, required: true)
   - `address` (String, size: 2000, required: false)
   - `upvotes` (Integer, required: false, default: 0)
   - `status` (String, size: 32, required: true, default: "open")
   - `reporterPhone` (String, size: 32, required: true)

5. **Configure Permissions** (Settings tab of Table):
   - **Permissions**:
     - **Any**: `Read` (Allows everyone to see rows)
     - **Users**: `Create`, `Read`, `Update` (Allows logged-in users to add and upvote rows)
     - (Optional) **Guests**: `Read`

## 5. Run the App
```bash
npm run dev
```
