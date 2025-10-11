declare global {
  interface Window {
    FB: {
      init: (config: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (callback: (response: unknown) => void, options?: { scope: string }) => void;
      api: (path: string, params: unknown, callback: (response: unknown) => void) => void;
    };
  }
}

export {};

