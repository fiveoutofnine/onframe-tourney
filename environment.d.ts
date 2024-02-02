declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Site
      BASE_URL: string;
      // Database
      DATABASE_URL: string;
    }
  }
}

export {};
