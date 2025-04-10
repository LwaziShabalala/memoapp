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

// Define the LemonSqueezy global type to match documentation
declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
      // Other potential properties based on documentation
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
  onSuccess,
  onCancel,
}) => {
  const [isLemonSqueezyReady, setIsLemonSqueezyReady] = useState(false);

  useEffect(() => {
    // Setup a timer to check for Lemon Squeezy availability periodically
    const checkInterval = setInterval(() => {
      if (window.LemonSqueezy) {
        clearInterval(checkInterval);
        setIsLemonSqueezyReady(true);
        console.log("Lemon Squeezy is ready", window.LemonSqueezy);
      }
    }, 500); // Check every 500ms

    // Attach a global event listener for Lemon Squeezy events
    const handleCheckoutSuccess = (event: Event) => {
      console.log("Checkout success event received", event);
      if (onSuccess && event instanceof CustomEvent) {
        onSuccess(event.detail);
      }
    };

    // Add event listener based on documentation
    window.addEventListener('lemonSqueezyPurchaseComplete', handleCheckoutSuccess);

    // Dynamically load the correct Lemon.js script
    if (!document.querySelector('script[src="https://app.lemonsqueezy.com/js/lemon.js"]')) {
      console.log("Loading Lemon Squeezy script");
      const script = document.createElement("script");
      script.src = "https://app.lemonsqueezy.com/js/lemon.js";
      script.defer = true;
      script.onload = () => {
        console.log("Lemon Squeezy script loaded");
        if (window.LemonSqueezy) {
          setIsLemonSqueezyReady(true);
          console.log("Lemon Squeezy is ready after script load");
        }
      };
      document.body.appendChild(script);
    } else if (window.LemonSqueezy) {
      // If script already exists and LemonSqueezy is loaded
      setIsLemonSqueezyReady(true);
      console.log("Lemon Squeezy already loaded");
    }

    return () => {
      // Clear interval to prevent memory leaks
      clearInterval(checkInterval);
      
      // Remove event listener
      window.removeEventListener('lemonSqueezyPurchaseComplete', handleCheckoutSuccess);
    };
  }, [onSuccess]);

  const handlePurchase = () => {
    console.log("🛒 Starting purchase for variant:", lemonSqueezyVariantId);

    if (!isLemonSqueezyReady || !window.LemonSqueezy) {
      alert("Payment system is not ready yet. Please try again later.");
      return;
    }

    try {
      // Use the store URL and variant ID to create the checkout URL
      // Replace [STORE] with your actual store subdomain
      const checkoutUrl = `https://[STORE].lemonsqueezy.com/checkout/custom/${lemonSqueezyVariantId}`;
      console.log("Opening checkout URL:", checkoutUrl);
      
      // Use the correct method according to documentation
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } catch (error) {
      console.error("Failed to open checkout:", error);
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
