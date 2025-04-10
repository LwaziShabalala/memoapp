// types/global.d.ts

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

    LemonSqueezy?: {
      Setup: (options: {
        activePopup?: boolean;
        eventHandler?: (data: LemonSqueezyEventData) => void;
      }) => void;
      Url?: {
        Open: (url: string) => void;
      };
      EmbedCheckout?: {
        Open: (options: {
          variantId: string;
          onSuccess: (data: unknown) => void;
          onError: (error: unknown) => void;
        }) => void;
      };
    };
  }

  interface LemonSqueezyEventData {
    event: string;
    data?: any;
  }
}

export {};
