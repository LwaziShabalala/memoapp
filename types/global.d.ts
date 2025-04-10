// This file should only contain type declarations, not any implementation code.

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
}

interface LemonSqueezyEventData {
  event: string;
  data?: LemonSqueezySuccessData;
}

interface LemonSqueezySuccessData {
  order?: {
    id: string;
    identifier: string;
    store_id: string;
    customer_id: string;
    total: string;
    status: string;
    [key: string]: unknown;
  };
  customer?: {
    id: string;
    email: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
