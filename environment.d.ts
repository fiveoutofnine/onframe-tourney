declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Site
      BASE_URL: string;
      // Upstash
      UPSTASH_URL: string;
      UPSTASH_TOKEN: string;
      // Database
      DATABASE_URL: string;
    }
  }
}

export {};
