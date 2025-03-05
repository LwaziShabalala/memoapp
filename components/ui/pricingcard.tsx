"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../app/styles/styles.css";

interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    storage: string;
    users?: string; // Make users optional
    sendUp: boolean;
    email?: string; // Make email optional
    onSuccess?: (paymentId: string) => void;
    onCancel?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    originalPrice,
    storage,
    users, // Keep for potential future use
    sendUp,
    email, // Keep for potential future use
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

        window.paypal.Buttons({
            createOrder: (_, actions) => {
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
            onApprove: (_, actions) => {
                return actions.order.capture().then((details) => {
                    console.log("Transaction completed by " + details.payer.name.given_name);
                    
                    // Trigger success callback with payment ID
                    onSuccess?.(details.id);

                    // Redirect to sign-up page
                    router.push("/sign-up");
                });
            },
            onCancel: () => {
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
                    {sendUp && title !== "1 Year Access" && (
                        <p className="leading-relaxed">
                            Exclusive features and priority updates coming soon!
                        </p>
                    )}
                </div>

                <div 
                    id="paypal-button-container" 
                    className="w-full"
                >
                    {!isPayPalReady ? (
                        <button 
                            disabled 
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg"
                        >
                            Loading...
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default PricingCard;
