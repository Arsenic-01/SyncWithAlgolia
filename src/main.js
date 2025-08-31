import algoliasearch from 'algoliasearch';
import { throwIfMissing } from './utils.js';

export default async ({ req, res, log, error }) => {
  // 1. Environment Variable Check
  throwIfMissing(process.env, [
    'ALGOLIA_APP_ID',
    'ALGOLIA_INDEX_ID',
    'ALGOLIA_ADMIN_API_KEY',
  ]);

  // 2. Event and Data Extraction
  const event = req.headers['x-appwrite-event'];
  const eventData = req.body;

  if (!event) {
    const message = "This function must be triggered by an Appwrite event.";
    log(message);
    return res.json({ success: false, message }, 400);
  }

  // 3. Initialize Algolia Client
  const algolia = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
  );
  const index = algolia.initIndex(process.env.ALGOLIA_INDEX_ID);

  // 4. Handle DELETE events universally
  if (event.includes('.delete')) {
    const documentId = eventData.$id;
    log(`Attempting to delete document: ${documentId} from Algolia.`);
    try {
      await index.deleteObject(documentId);
      log(`Successfully deleted document ${documentId} from index.`);
      return res.json({ success: true, message: `Document ${documentId} deleted.` });
    } catch (err) {
      error(`Failed to delete document ${documentId}: ${err.message}`);
      return res.json({ success: false, error: err.message }, 500);
    }
  }

  // 5. Handle CREATE/UPDATE events
  if (event.includes('.create') || event.includes('.update')) {
    let record;
    const collectionId = event.split('.')[2]; // e.g., databases.main.collections.notes.documents...

    log(`Syncing Create/Update for collection '${collectionId}', document: ${eventData.$id}`);

    // Use a switch to build the correct record based on the collection
    switch (collectionId) {
      case process.env.APPWRITE_NOTE_COLLECTION_ID:
        record = {
          objectID: eventData.$id,
          type: 'note',
          title: eventData.title,
          description: eventData.description,
          abbreviation: eventData.abbreviation,
          path: `/semester/${eventData.semester}/${eventData.abbreviation}#note-${eventData.$id}`
        };
        break;
      case process.env.APPWRITE_SUBJECT_COLLECTION_ID:
        record = {
          objectID: eventData.$id,
          type: 'subject',
          title: eventData.name,
          abbreviation: eventData.abbreviation,
          code: eventData.code,
          path: `/semester/${eventData.semester}/#subject-${eventData.$id}`
        };
        break;
      case process.env.APPWRITE_YOUTUBE_COLLECTION_ID:
         record = {
          objectID: eventData.$id,
          type: "youtube",
          title: eventData.title,
          abbreviation: eventData.abbreviation,
          path: `/semester/${eventData.semester ?? 'unknown'}/${eventData.abbreviation ?? 'unknown'}#youtube-${eventData.$id}`
        };
        break;
      case process.env.APPWRITE_QUIZ_COLLECTION_ID:
        record = {
            objectID: eventData.$id,
            type: 'quiz',
            title: eventData.title,
            url: eventData.url
        };
        break;
      default:
        log(`Unhandled collection for sync: ${collectionId}`);
        return res.json({ success: false, message: `Collection type '${collectionId}' not handled.`}, 400);
    }

    try {
      await index.saveObject(record);
      log(`Successfully synced document ${record.objectID}`);
      return res.json({ success: true, message: `Document ${record.objectID} synced.` });
    } catch (err) {
      error(`Failed to sync document ${record.objectID}: ${err.message}`);
      return res.json({ success: false, error: err.message }, 500);
    }
  }

  log(`Unhandled event type: ${event}`);
  return res.json({ success: false, message: 'Event type not handled.'}, 400);
};