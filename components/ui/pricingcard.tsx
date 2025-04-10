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

// Define error data type for consistency
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
    // Track whether the component is still mounted
    let isMounted = true;
    
    // Setup a timer to check for Lemon Squeezy availability
    const checkInterval = setInterval(() => {
      if (window.LemonSqueezy && isMounted) {
        clearInterval(checkInterval);
        setIsLemonSqueezyReady(true);
        console.log("Lemon Squeezy is ready");
        
        // Setup if available (based on existing type)
        if (typeof window.LemonSqueezy.Setup === 'function') {
          window.LemonSqueezy.Setup({ activePopup: true });
        }
      }
    }, 500);

    // Attach event listeners for checkout success
    const handleCheckoutSuccess = (event: Event) => {
      console.log("Checkout success event received", event);
      if (onSuccess && event instanceof CustomEvent && event.detail) {
        onSuccess(event.detail);
      }
    };

    window.addEventListener('lemonSqueezyPurchaseComplete', handleCheckoutSuccess);

    // Load the Lemon Squeezy script
    const loadScript = () => {
      if (!document.querySelector('script[src="https://app.lemonsqueezy.com/js/lemon.js"]')) {
        console.log("Loading Lemon Squeezy script");
        const script = document.createElement("script");
        script.src = "https://app.lemonsqueezy.com/js/lemon.js";
        script.defer = true;
        document.body.appendChild(script);
      }
    };

    loadScript();

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
      window.removeEventListener('lemonSqueezyPurchaseComplete', handleCheckoutSuccess);
    };
  }, [onSuccess]);

  const handlePurchase = () => {
    console.log("🛒 Starting purchase for variant:", lemonSqueezyVariantId);

    if (!isLemonSqueezyReady || !window.LemonSqueezy) {
      alert("Payment system is not ready yet. Please try again.");
      return;
    }

    try {
      // We need to handle both API patterns based on what's available
      // This avoids type errors while supporting multiple LemonSqueezy versions
      
      // First try the EmbedCheckout method from the type definition
      if (window.LemonSqueezy.EmbedCheckout && typeof window.LemonSqueezy.EmbedCheckout.Open === 'function') {
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
      } 
      // If not available, try to use the URL approach mentioned in documentation
      else {
        // Create a custom link to the checkout page
        const storeUrl = prompt("Please enter your Lemon Squeezy store URL (e.g., my-store.lemonsqueezy.com):");
        if (!storeUrl) return;
        
        const checkoutUrl = `https://${storeUrl}/checkout/custom/${lemonSqueezyVariantId}`;
        
        // Create a temporary link and click it
        const tempLink = document.createElement('a');
        tempLink.href = checkoutUrl;
        tempLink.className = 'lemonsqueezy-button';
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
      }
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
