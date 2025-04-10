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

// Define error callback data type
interface LemonSqueezyErrorData {
  error: string;
  [key: string]: unknown;
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
        console.log("Lemon Squeezy is ready");
        
        // Setup with the activePopup option
        window.LemonSqueezy.Setup({
          activePopup: true
        });
      }
    }, 500); // Check every 500ms

    // Attach a global event listener for Lemon Squeezy events
    const handleLemonSqueezyEvents = (event: Event) => {
      // Check if this is a custom event from Lemon Squeezy
      if (event instanceof CustomEvent && event.detail) {
        if (onSuccess) {
          onSuccess(event.detail);
        }
      }
    };

    // Add event listener for Lemon Squeezy checkout success
    window.addEventListener('lemonSqueezy:checkout:success', handleLemonSqueezyEvents);

    // Dynamically load the Lemon.js script if it's not already loaded
    if (!document.querySelector('script[src="https://assets.lemonsqueezy.com/lemon.js"]')) {
      const script = document.createElement("script");
      script.src = "https://assets.lemonsqueezy.com/lemon.js";
      script.defer = true;
      document.body.appendChild(script);
    } else {
      // If script already exists, check if Lemon Squeezy is already loaded
      if (window.LemonSqueezy) {
        setIsLemonSqueezyReady(true);
        window.LemonSqueezy.Setup({
          activePopup: true
        });
      }
    }

    return () => {
      // Clear interval to prevent memory leaks
      clearInterval(checkInterval);
      
      // Remove event listener
      window.removeEventListener('lemonSqueezy:checkout:success', handleLemonSqueezyEvents);
    };
  }, [onSuccess]);

  const handlePurchase = () => {
    console.log("🛒 Starting purchase for variant:", lemonSqueezyVariantId);

    if (!isLemonSqueezyReady || !window.LemonSqueezy) {
      alert("Payment system is not ready yet. Please try again later.");
      return;
    }

    try {
      // Use EmbedCheckout.Open to match the existing type definition
      window.LemonSqueezy.EmbedCheckout.Open({
        variantId: lemonSqueezyVariantId,
        onSuccess: (data) => {
          if (onSuccess) onSuccess(data);
        },
        onError: (error) => {
          console.error("Checkout error:", error);
          if (onCancel) onCancel();
        }
      });
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
