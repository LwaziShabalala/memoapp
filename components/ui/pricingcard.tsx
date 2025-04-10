import React, { useState } from "react";

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
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  originalPrice,
  storage,
  users,
  lemonSqueezyVariantId,
  storeUrl,
}) => {
  const [isLemonSqueezyReady, setIsLemonSqueezyReady] = useState(true); // We don’t need to wait for the SDK

  const handlePurchase = () => {
    // Directly open the LemonSqueezy checkout page
    const checkoutUrl = `https://${storeUrl}.lemonsqueezy.com/checkout/custom/${lemonSqueezyVariantId}`;
    window.location.href = checkoutUrl; // Redirects the user to the checkout page
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
            {isLemonSqueezyReady ? "Get Started Now" : "Loading..."}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
