// This makes sure TypeScript knows about the global LemonSqueezy object

export interface LemonSqueezySuccessData {
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

export interface LemonSqueezyErrorData {
  errorMessage: string;
  errorCode: string;
}

// Extend the global Window object
declare global {
  interface Window {
    LemonSqueezy?: {
      Setup: (options: { activePopup: boolean }) => void;
      EmbedCheckout: {
        Open: (options: {
          variantId: string;
          onSuccess: (data: LemonSqueezySuccessData) => void;
          onError: (error: LemonSqueezyErrorData) => void;
        }) => void;
      };
    };
    createLemonSqueezy?: () => void;
  }
}

export {};
