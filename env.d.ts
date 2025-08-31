declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ALGOLIA_APP_ID: string;
      ALGOLIA_ADMIN_API_KEY: string;
      ALGOLIA_SEARCH_API_KEY: string;
      ALGOLIA_INDEX_ID: string;
      APPWRITE_NOTE_COLLECTION_ID: string;
      APPWRITE_SUBJECT_COLLECTION_ID: string;
      APPWRITE_YOUTUBE_COLLECTION_ID: string;
      APPWRITE_QUIZ_COLLECTION_ID: string;
    }
  }
}

export {};
