import React from "react";

interface Feature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  features: Feature[];
  highlighted?: boolean;
  checkoutUrl: string;
  updatedText?: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  originalPrice,
  features,
  highlighted = false,
  checkoutUrl,
  updatedText,
}) => {
  const handlePurchase = () => {
    window.location.href = checkoutUrl;
  };

  return (
    <div 
      className={`flex flex-col rounded-xl ${
        highlighted ? 'border border-green-500' : 'bg-gray-800'
      } p-8`}
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-5">{title}</h2>
        <div className="flex items-center gap-2 mb-2">
          {originalPrice && (
            <span className="text-gray-400 line-through text-sm">${originalPrice}</span>
          )}
          <span className="text-5xl font-bold text-white">${price}</span>
          <span className="text-gray-400 text-sm">USD</span>
        </div>
      </div>

      <div className="flex-grow">
        <div className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              {feature.included ? (
                <svg className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className={`${feature.included ? 'text-white' : 'text-gray-400'} text-sm`}>
                {feature.text}
              </span>
            </div>
          ))}
          
          {updatedText && (
            <div className="mt-4">
              <span className="bg-green-500 text-black text-xs px-3 py-1 rounded-full">
                {updatedText}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handlePurchase}
        className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors"
      >
        Get {title}
      </button>
      
      <p className="text-center text-gray-400 text-sm mt-4">
        Pay once. Build unlimited projects!
      </p>
    </div>
  );
};

export default PricingCard;
