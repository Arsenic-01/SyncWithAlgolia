# Appwrite → Algolia Sync Function

This cloud function syncs Appwrite database documents with an Algolia search index in real-time.
It handles **create**, **update**, and **delete** events for multiple collections and keeps the search index updated.

---

## Features

* Automatically updates Algolia index when documents are created, updated, or deleted in Appwrite.
* Handles multiple collections (`Notes`, `Subjects`, `YouTube`, `Quiz`) dynamically.
* Provides detailed logging for sync operations and errors.

---

## Prerequisites

* **Appwrite Project** (v1.4+ recommended)
* **Algolia Account** with:

  * Application ID
  * Admin API Key
  * Target Index Name

---

## Environment Variables

Set these in your Appwrite function's **Environment Variables** section:

| Key                              | Description                    |
| -------------------------------- | ------------------------------ |
| `ALGOLIA_APP_ID`                 | Your Algolia Application ID    |
| `ALGOLIA_INDEX_ID`               | Target index in Algolia        |
| `ALGOLIA_ADMIN_API_KEY`          | Admin API Key for Algolia      |
| `APPWRITE_NOTE_COLLECTION_ID`    | ID of your Notes collection    |
| `APPWRITE_SUBJECT_COLLECTION_ID` | ID of your Subjects collection |
| `APPWRITE_YOUTUBE_COLLECTION_ID` | ID of your YouTube collection  |
| `APPWRITE_QUIZ_COLLECTION_ID`    | ID of your Quiz collection     |

---

## Event Triggers

Enable the function for these Appwrite events:

* `databases.*.collections.*.documents.*.create`
* `databases.*.collections.*.documents.*.update`
* `databases.*.collections.*.documents.*.delete`

This ensures all relevant database operations are captured.

---

## Function Workflow

1. **Validate Environment Variables**
   Ensures required keys are available before running.

2. **Extract Event Data**
   Reads `x-appwrite-event` header and request body.

3. **Delete Event Handling**
   Removes document from Algolia if deleted in Appwrite.

4. **Create / Update Event Handling**

   * Identifies collection from event path.
   * Maps document data into a proper Algolia record.
   * Updates index using `saveObject`.

---

## Local Development

You can test the function locally with:

```bash
npm install
npx functions-emulator start
```

Send a sample payload:

```bash
curl -X POST http://localhost:3000 \
  -H "x-appwrite-event: databases.main.collections.notes.documents.create" \
  -H "Content-Type: application/json" \
  -d '{"$id":"doc1","title":"Sample Note","abbreviation":"SN"}'
```

---

## Deployment

1. Zip your function code:

   ```bash
   zip -r function.zip .
   ```
2. Upload to Appwrite Console → Functions → Upload Function.
3. Set runtime to **Node.js 18+**.
4. Configure environment variables & events.
5. Deploy and test with a sample database event.

---

## Error Handling

* Logs failures using `error()` for easier debugging in Appwrite's function logs.
* Returns HTTP status `400` for invalid events or missing configurations.
* Returns `500` for Algolia operation errors.

---

