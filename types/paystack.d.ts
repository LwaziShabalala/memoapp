// types/paystack.d.ts

interface PaystackPopInterface {
    setup(options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        metadata?: any;
        onClose?: () => void;
        callback?: (response: { reference: string }) => void;
    }): {
        openIframe(): void;
    };
}

declare global {
    interface Window {
        PaystackPop: PaystackPopInterface;
    }
}

export {};