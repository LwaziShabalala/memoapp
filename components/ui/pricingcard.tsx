"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

// Define props for the card
interface PricingCardProps {
  title: string;
  price: string;
  storage: string;
  users: string;
  lemonSqueezyVariantId: string;
}

// Define the types for success and error callback data
interface LemonSqueezySuccessData {
  orderId: string;
  variantId: string;
  amount: number;
  currency: string;
}

interface LemonSqueezyErrorData {
  errorMessage: string;
  errorCode: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  storage,
  users,
  lemonSqueezyVariantId,
}) => {
  const [isLemonSqueezyReady, setIsLemonSqueezyReady] = useState(false);

  useEffect(() => {
    const loadLemonSqueezy = () => {
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({ activePopup: true });
        setIsLemonSqueezyReady(true);
      }
    };

    // Check if LemonSqueezy is already loaded, otherwise load the script
    if (window.LemonSqueezy) {
      loadLemonSqueezy();
    } else {
      // This ensures LemonSqueezy is loaded and setup is called when the script is ready
      const script = document.createElement("script");
      script.src = "https://assets.lemonsqueezy.com/lemon.js";
      script.async = true;
      script.onload = loadLemonSqueezy;
      document.body.appendChild(script);
    }
  }, []);

  const handlePurchase = () => {
    if (!isLemonSqueezyReady || !window.LemonSqueezy) {
      alert("Payment system is not ready yet. Please try again later.");
      return;
    }

    window.LemonSqueezy.EmbedCheckout.Open({
      variantId: lemonSqueezyVariantId,
      onSuccess: (data: LemonSqueezySuccessData) => {
        console.log("Payment successful", data);
        // Use a better method for redirection, preserving application state
        window.location.href = "/success";  // Adjust this as needed
      },
      onError: (error: LemonSqueezyErrorData) => {
        console.error("Payment error", error);
        alert("Something went wrong. Please try again.");
      },
    });
  };

  return (
    <>
      {/* Load LemonSqueezy SDK globally */}
      <Script
        src="https://assets.lemonsqueezy.com/lemon.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.LemonSqueezy) {
            window.LemonSqueezy.Setup({ activePopup: true });
            setIsLemonSqueezyReady(true);
          }
        }}
      />

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>

        <div className="relative bg-gray-900 text-white rounded-xl shadow-lg p-8 space-y-8 min-h-[400px]">
          <header className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {title}
            </h2>
            <div className="flex items-center justify-center gap-4">
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
    </>
  );
};

export default PricingCard;
