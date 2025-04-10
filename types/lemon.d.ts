// types/lemon.d.ts
export {};

declare global {
  interface Window {
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
