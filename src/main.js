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
    const message = "Function was not triggered by an Appwrite event.";
    error(message);
    return res.json({ success: false, message }, 400);
  }

  // 3. Initialize Algolia Client
  const algolia = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
  );
  const index = algolia.initIndex(process.env.ALGOLIA_INDEX_ID);

  // 4. Handle DELETE events
  if (event.includes('.delete')) {
    const documentId = eventData.$id;
    log(`Attempting to delete document from Algolia: ${documentId}`);
    try {
      await index.deleteObject(documentId);
      log(`Successfully deleted document: ${documentId}`);
      return res.json({ success: true, message: `Document ${documentId} deleted.` });
    } catch (err) {
      error(`Failed to delete document ${documentId}: ${err.message}`);
      return res.json({ success: false, error: err.message }, 500);
    }
  }

  // 5. Handle CREATE/UPDATE events
  if (event.includes('.create') || event.includes('.update')) {
    const collectionId = event.split('.')[3];
    const documentId = eventData.$id;

    log(`Syncing document: ${documentId} from collection: ${collectionId}`);

    let record;
    // Use a switch to build the correct record based on the collection
    switch (collectionId) {
      case process.env.APPWRITE_NOTE_COLLECTION_ID:
        record = {
          objectID: eventData.$id,
          type: 'note',
          title: eventData.title,
          description: eventData.description,
          abbreviation: eventData.abbreviation,
          path: `/semester/${eventData.semester}/${eventData.abbreviation}?noteId=${eventData.$id}#note-${eventData.$id}`,
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
          path: `/semester/${eventData.semester}/${eventData.abbreviation}?youtubeId=${eventData.$id}#youtube-${eventData.$id}`,
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
        error(`Unhandled collection for sync: ${collectionId}`);
        return res.json({ success: false, message: `Collection type '${collectionId}' not handled.`}, 400);
    }

    try {
      await index.saveObject(record);
      log(`Successfully synced document: ${documentId}`);
      return res.json({ success: true, message: `Document ${documentId} synced.` });
    } catch (err) {
      error(`Failed to sync document ${documentId}: ${err.message}`);
      return res.json({ success: false, error: err.message }, 500);
    }
  }

  // Use error log for unhandled cases
  error(`Unhandled event type: ${event}`);
  return res.json({ success: false, message: 'Event type not handled.'}, 400);
};
