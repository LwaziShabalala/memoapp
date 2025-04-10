"use client";
import React, { useEffect, useState } from "react";
import Script from "next/script";

// Define types for the props
interface PricingCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  storage: string;
  users: string;
  sendUp?: boolean;
  lemonSqueezyVariantId: string;
  onSuccess?: (data: LemonSqueezySuccessData) => void;
  onCancel?: () => void;
}

// Define success callback data type
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

// Define the event structure for LemonSqueezy events
interface LemonSqueezyEvent {
  event: string;
  data?: LemonSqueezySuccessData; // For events like 'Checkout.Success'
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  originalPrice,
  storage,
  users,
  sendUp,
  lemonSqueezyVariantId,
  onSuccess,
  onCancel,
}) => {
  const [isLemonSqueezyReady, setIsLemonSqueezyReady] = useState(false);

  useEffect(() => {
    const loadLemonSqueezy = () => {
      if (window?.LemonSqueezy) {
        // Set up the event handler
        window.LemonSqueezy.Setup({
          eventHandler: (event: LemonSqueezyEvent) => {
            // Handle specific events
            if (event.event === "Checkout.Success") {
              console.log("Checkout was successful:", event.data);
              if (onSuccess) {
                onSuccess(event.data);
              }
            }

            if (event.event === "PaymentMethodUpdate.Updated") {
              console.log("Payment method updated:", event.data);
            }
          },
        });

        setIsLemonSqueezyReady(true);
      }
    };

    // Dynamically load the Lemon.js script
    const script = document.createElement("script");
    script.src = "https://assets.lemonsqueezy.com/lemon.js";
    script.defer = true;
    script.onload = loadLemonSqueezy;
    document.body.appendChild(script);

    return () => {
      // Clean up the script when the component unmounts
      document.body.removeChild(script);
    };
  }, [onSuccess]);

  const handlePurchase = () => {
    console.log("🛒 Starting purchase for variant:", lemonSqueezyVariantId);

    if (!isLemonSqueezyReady || !window.LemonSqueezy) {
      alert("Payment system is not ready yet. Please try again later.");
      return;
    }

    // Open the checkout using the LemonSqueezy.Url.Open method
    const checkoutUrl = `https://[STORE].lemonsqueezy.com/checkout/custom/${lemonSqueezyVariantId}`;
    window.LemonSqueezy.Url.Open(checkoutUrl);
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
      <div className="relative bg-gray-900 text-white rounded-xl shadow-lg p-8 space-y-8 min-h-[400px]">
        <header className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            {title}
          </h2>
          <div className="flex items-center justify-center gap-2">
            {originalPrice && (
              <p className="text-lg text-gray-400 line-through">
                {originalPrice}
              </p>
            )}
            <p className="text-4xl font-extrabold text-white">{price}</p>
          </div>
        </header>
        <div className="space-y-4 text-base text-gray-300">
          <p className="leading-relaxed">{storage}</p>
          <p className="leading-relaxed text-sm text-gray-400">{users}</p>
        </div>
        <div className="w-full">
          <button
            onClick={handlePurchase}
            disabled={!isLemonSqueezyReady}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
          >
            {!isLemonSqueezyReady ? "Loading..." : "Get Started Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
