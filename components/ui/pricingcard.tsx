"use client";

import React, { useEffect, useRef } from "react";
import "../../app/styles/styles.css";

// Define types for LemonSqueezy object
declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      setup: (options?: { eventHandler?: (data: LemonSqueezyEvent) => void }) => void;
      Url: {
        open: (url: string) => void;
      };
    }
  }
}

// Define specific types for LemonSqueezy events
interface LemonSqueezyEventBase {
  event: string;
}

interface CheckoutSuccessData {
  id: string;
  [key: string]: unknown;
}

interface CheckoutSuccessEvent extends LemonSqueezyEventBase {
  event: 'Checkout.Success';
  data: {
    data: CheckoutSuccessData;
    [key: string]: unknown;
  };
}

interface CheckoutClosedEvent extends LemonSqueezyEventBase {
  event: 'Checkout.Closed';
}

type LemonSqueezyEvent = CheckoutSuccessEvent | CheckoutClosedEvent | (LemonSqueezyEventBase & { [key: string]: unknown });

interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    storage: string;
    users: string;
    sendUp: boolean;
    checkoutUrl: string; // LemonSqueezy checkout URL
    onSuccess?: (paymentId: string) => void;
    onCancel?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    originalPrice,
    storage,
    users, 
    sendUp,
    checkoutUrl,
    onSuccess,
    onCancel
}) => {
    const buttonRef = useRef<HTMLDivElement>(null);
    const buttonId = `lemonsqueezy-button-${title.replace(/\s+/g, '-').toLowerCase()}`;

    const handleLemonSqueezyEvent = (data: LemonSqueezyEvent) => {
        if (data.event === 'Checkout.Success') {
            console.log('Purchase successful!', data);
            if (onSuccess && 'data' in data && data.data && typeof data.data === 'object' && 
                'data' in data.data && data.data.data && 
                typeof data.data.data === 'object' && 'id' in data.data.data) {
                // Convert id to string to ensure type safety
                const paymentId = String(data.data.data.id);
                onSuccess(paymentId);
            }
        }
        
        if (data.event === 'Checkout.Closed') {
            console.log('Checkout closed without purchase');
            if (onCancel) {
                onCancel();
            }
        }
    };

    useEffect(() => {
        // Add LemonSqueezy script if it doesn't exist
        if (!document.getElementById('lemonsqueezy-script')) {
            const script = document.createElement("script");
            script.src = "https://assets.lemonsqueezy.com/lemon.js";
            script.async = true;
            script.defer = true;
            script.id = "lemonsqueezy-script";
            
            // Setup LemonSqueezy after script loads
            script.onload = () => {
                if (window.createLemonSqueezy) {
                    window.createLemonSqueezy();
                }
                
                if (window.LemonSqueezy) {
                    window.LemonSqueezy.setup({
                        eventHandler: handleLemonSqueezyEvent
                    });
                }
            };
            
            document.body.appendChild(script);
        } else if (window.LemonSqueezy) {
            // If script already exists, just setup the event handler
            window.LemonSqueezy.setup({
                eventHandler: handleLemonSqueezyEvent
            });
        }
    }, [onSuccess, onCancel]);

    return (
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>

            <div className="relative bg-gray-900 text-white rounded-xl shadow-lg p-8 space-y-8 min-h-[400px]">
                <header className="text-center space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        {title}
                    </h2>
                    <div className="flex items-center justify-center gap-4">
                        {originalPrice && (
                            <span className="text-xl text-gray-400 line-through">
                                {originalPrice}
                            </span>
                        )}
                        <p className="text-4xl font-extrabold text-white">{price}</p>
                    </div>
                </header>

                <div className="space-y-4 text-base text-gray-300">
                    <p className="leading-relaxed">{storage}</p>
                    <p className="leading-relaxed text-sm text-gray-400">{users}</p>
                    {sendUp && title !== "1 Year Access" && (
                        <p className="leading-relaxed">
                            Exclusive features and priority updates coming soon!
                        </p>
                    )}
                </div>

                <div ref={buttonRef} className="w-full">
                    <a 
                        id={buttonId}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg flex items-center justify-center cursor-pointer lemonsqueezy-button"
                        href={checkoutUrl}
                    >
                        Get Started Now
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PricingCard;
