declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    gtag: (
      command: string,
      targetId: string,
      config?: {
        page_path?: string;
        [key: string]: any;
      }
    ) => void;
    dataLayer: any[];
  }
}

export {}; // This makes the file a module
