"use client";
import React, { useEffect, useState } from "react";

// Define types for the props
interface PricingCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  storage: string;
  users: string;
  sendUp?: boolean;
  lemonSqueezyVariantId: string;
  storeUrl: string; // Add store URL as a required prop
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

// Define LemonSqueezy event data interface
interface LemonSqueezyEventData {
  event: string;
  data?: LemonSqueezySuccessData;
}

declare global {
  interface Window {
    LemonSqueezy?: {
      Setup: (options: {
        activePopup?: boolean;
        eventHandler?: (data: LemonSqueezyEventData) => void;
      }) => void;
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  originalPrice,
  storage,
  users,
  sendUp,
  lemonSqueezyVariantId,
  storeUrl,
  onSuccess,
  onCancel,
}) => {
  const [isLemonSqueezyReady, setIsLemonSqueezyReady] = useState(false);

  useEffect(() => {
    // Create and insert the script tag
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    script.async = true;
    
    // Define what happens on script load
    script.onload = () => {
      if (window.LemonSqueezy) {
        console.log("Lemon.js loaded successfully");
        
        // Set up event handling
        window.LemonSqueezy.Setup({
          eventHandler: (data) => {
            console.log("Lemon Squeezy event:", data);
            if (data.event === "Checkout.Success" && onSuccess) {
              console.log("Checkout success:", data.data);
              onSuccess(data.data);
            }
          }
        });
        
        setIsLemonSqueezyReady(true);
      }
    };
    
    // Handle errors
    script.onerror = () => {
      console.error("Failed to load Lemon.js");
      alert("Payment system failed to load. Please refresh and try again.");
    };
    
    // Add the script to the document
    document.body.appendChild(script);
    
    // Cleanup function
    return () => {
      // Only remove if it exists and has a parent
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onSuccess]);

  const handlePurchase = () => {
    console.log("🛒 Starting purchase for variant:", lemonSqueezyVariantId);

    if (!isLemonSqueezyReady || !window.LemonSqueezy) {
      alert("Payment system is not ready yet. Please refresh and try again.");
      return;
    }

    try {
      // Construct the checkout URL according to the docs
      const checkoutUrl = `https://${storeUrl}.lemonsqueezy.com/checkout/custom/${lemonSqueezyVariantId}`;
      console.log("Opening checkout URL:", checkoutUrl);
      
      // Use the Url.Open method as shown in the documentation
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } catch (error) {
      console.error("Failed to open checkout:", error);
      if (onCancel) onCancel();
      alert("There was an error opening the checkout. Please try again later.");
    }
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
