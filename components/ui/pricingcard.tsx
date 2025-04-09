"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import "../../app/styles/styles.css";

// LemonSqueezy interfaces
interface LemonSqueezyCheckoutOptions {
  checkoutUrl?: string;
  buyButtonTarget?: string;
  storeId?: string;
  variantId?: string;
  productId?: string;
  checkoutData?: Record<string, string>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (options?: { activePopup?: boolean }) => void;
      Url: {
        Open: (checkoutUrl: string) => void;
      };
      EmbedCheckout: {
        Open: (options: LemonSqueezyCheckoutOptions) => void;
      };
    };
  }
}

interface PricingCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  storage: string;
  users: string;
  sendUp: boolean;
  lemonSqueezyVariantId: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
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
  onCancel
}) => {
  const [isLemonSqueezyReady, setIsLemonSqueezyReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize LemonSqueezy when the script is loaded
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Setup({ activePopup: true });
      setIsLemonSqueezyReady(true);
    }
  }, []);

  const handlePurchase = () => {
    if (!isLemonSqueezyReady || !window.LemonSqueezy) {
      setPaymentError("Payment system is loading. Please try again in a moment.");
      return;
    }
    
    setPaymentError(null);
    
    try {
      // Open LemonSqueezy checkout
      window.LemonSqueezy.EmbedCheckout.Open({
        variantId: lemonSqueezyVariantId,
        checkoutData: {
          custom: {
            plan_title: title,
            plan_storage: storage
          },
          customer: {
            email: ""  // Can be pre-filled if user is logged in
          }
        },
        onSuccess: (data) => {
          console.log("Payment successful:", data);
          
          // You can add server verification here similar to the PayPal implementation
          try {
            fetch('/api/payment/verify-lemonsqueezy', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: data.order?.id,
                paymentDetails: data,
                planTitle: title,
                planStorage: storage
              }),
            }).then(response => {
              if (!response.ok) {
                throw new Error('Failed to verify payment with server');
              }
              return response.json();
            }).then(result => {
              console.log("Payment verified:", result);
            });
          } catch (error) {
            console.error("Server verification error:", error);
          }
          
          onSuccess?.(data);
          router.push(`/sign-up?payment=success&order=${data.order?.id}`);
        },
        onError: (error) => {
          console.error("LemonSqueezy Error:", error);
          setPaymentError("Payment processing error. Please try again later.");
          onCancel?.();
        }
      });
    } catch (error) {
      console.error("LemonSqueezy initialization error:", error);
      setPaymentError("Failed to load payment options.");
    }
  };

  return (
    <>
      {/* Load LemonSqueezy SDK globally */}
      <Script
        src="https://assets.lemonsqueezy.com/lemon.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.createLemonSqueezy) {
            window.createLemonSqueezy();
            if (window.LemonSqueezy) {
              window.LemonSqueezy.Setup({ activePopup: true });
              setIsLemonSqueezyReady(true);
            }
          }
        }}
        onError={(e) => {
          console.error("LemonSqueezy SDK failed to load", e);
          setPaymentError("Failed to load payment system. Please refresh the page.");
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

          {paymentError && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded mb-4">
              {paymentError}
            </div>
          )}

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
