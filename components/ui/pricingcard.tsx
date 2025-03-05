"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../app/styles/styles.css";

interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    storage: string;
    users: string;
    sendUp: boolean;
    email: string;
    onSuccess?: (reference: string) => void;
    onCancel?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    originalPrice,
    storage,
    users,
    sendUp,
    email,
    onSuccess,
    onCancel
}) => {
    const [isPayPalReady, setIsPayPalReady] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Dynamically load PayPal script
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
        script.async = true;

        script.onload = () => {
            if (window.paypal) {
                setIsPayPalReady(true);
            }
        };

        document.body.appendChild(script);

        return () => {
            if (script) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handlePayment = () => {
        if (!isPayPalReady || !window.paypal) return;

        const amount = parseFloat(price.replace(/[^0-9.-]+/g, ""));
        const reference = `ref-${title.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`;

        window.paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: amount.toFixed(2),
                            currency_code: "USD"
                        },
                        description: `${title} - ${storage}`
                    }]
                });
            },
            onApprove: (data, actions) => {
                return actions.order.capture().then((details) => {
                    console.log("Transaction completed by " + details.payer.name.given_name);
                    
                    // Trigger success callback
                    onSuccess?.(details.id);

                    // Redirect to sign-up page
                    router.push("/sign-up");
                });
            },
            onCancel: (data) => {
                console.log("Transaction was canceled");
                onCancel?.();
            },
            onError: (err) => {
                console.error("PayPal Error:", err);
                onCancel?.();
            }
        }).render('#paypal-button-container');
    };

    return (
        <div className="relative group">
            {/* Existing card design */}
            <div className="relative bg-gray-900 text-white rounded-xl shadow-lg p-8 space-y-8 min-h-[400px]">
                {/* Header section remains the same */}
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

                {/* Features section remains the same */}
                <div className="space-y-4 text-base text-gray-300">
                    <p className="leading-relaxed">{storage}</p>
                    {sendUp && title !== "1 Year Access" && (
                        <p className="leading-relaxed">
                            Exclusive features and priority updates coming soon!
                        </p>
                    )}
                </div>

                {/* PayPal Button Container */}
                <div 
                    id="paypal-button-container" 
                    className="w-full"
                    onClick={handlePayment}
                >
                    {!isPayPalReady && (
                        <button 
                            disabled 
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg"
                        >
                            Loading...
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PricingCard;
