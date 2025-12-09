# Fix Appwrite Permissions

The error `The current user is not authorized to perform the requested action` means your Appwrite Database Collection is missing the required permissions.

## Steps to Fix

1.  **Open Appwrite Console**: Go to [https://cloud.appwrite.io/console](https://cloud.appwrite.io/console).
2.  **Select Project**: Click on your project (ID: `692b...`).
3.  **Go to Databases**: Click "Databases" in the left sidebar.
4.  **Select Database**: Click on your database (ID: `692b...`).
5.  **Select Collection**: Click on the **"Reports"** collection (ID: `tb01`).
6.  **Go to Settings**: Click the **"Settings"** tab (or "Permissions").
7.  **Update Permissions**:
    *   Scroll down to **Permissions**.
    *   Click **"Add Role"**.
    *   Select **"Any"** (or "Users" if you want to restrict to logged-in users).
    *   Check the boxes for:
        *   **Create** (Required for submitting reports)
        *   **Read** (Required for viewing reports)
        *   **Update** (Required for upvoting)
    *   Click **Update** to save.

## Why this happened?
By default, new collections in Appwrite often have no permissions enabled for security. You must explicitly allow users to create and read documents.
