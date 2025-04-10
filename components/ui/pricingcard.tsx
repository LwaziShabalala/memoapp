"use client";
import React, { useEffect, useState } from "react";
import "../../types/lemon";



// Props interface
interface PricingCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  storage: string;
  users: string;
  sendUp?: boolean;
  lemonSqueezyVariantId: string;
  storeUrl: string;
  onSuccess?: (data: LemonSqueezySuccessData) => void;
  onCancel?: () => void;
}

// Lemon Squeezy success data interface
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

// Lemon Squeezy event data interface
interface LemonSqueezyEventData {
  event: string;
  data?: LemonSqueezySuccessData;
}

// ✅ Correct way to augment the global `Window` interface
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
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    script.async = true;

    script.onload = () => {
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({
          eventHandler: (data) => {
            if (data.event === "Checkout.Success" && onSuccess) {
              onSuccess(data.data || {});
            }
          },
        });
        setIsLemonSqueezyReady(true);
      }
    };

    script.onerror = () => {
      console.error("Failed to load Lemon.js");
      alert("Payment system failed to load. Please refresh and try again.");
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onSuccess]);

  const handlePurchase = () => {
    if (!isLemonSqueezyReady || !window.LemonSqueezy) {
      alert("Payment system is not ready yet. Please refresh and try again.");
      return;
    }

    try {
      const checkoutUrl = `https://${storeUrl}.lemonsqueezy.com/checkout/custom/${lemonSqueezyVariantId}`;
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } catch (error) {
      console.error("Failed to open checkout:", error);
      if (onCancel) onCancel();
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
