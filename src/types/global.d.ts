// Global type declarations
declare module "fuse.js" {
  export default class Fuse<T> {
    constructor(list: T[], options?: any);
    search(pattern: string): Array<{ item: T; score?: number }>;
  }
}

// Auth bridge types
interface Window {
  __authBridge?: {
    login: (redirectUri?: string) => Promise<string>;
    logout: (redirectUri?: string) => Promise<string>;
    getState: () => Promise<{ signedIn: boolean; email?: string | null; groups?: string[] }>;
  };
  __userSession?: {
    signedIn: boolean;
    user: { email?: string } | null;
    groups: string[];
  };
  updateAuthIcon?: () => void;
  setupAuthButton?: () => void;
}

// Intentionally avoid shimming React/ReactDOM here to prevent shadowing @types/react.
