"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter from Next.js
import "../../app/styles/styles.css";

interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    storage: string;
    users: string;
    sendUp: boolean;
    email?: string;
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
    email = "test@example.com",
    onSuccess,
    onCancel
}) => {
    const [isPaystackReady, setIsPaystackReady] = useState(false);
    const router = useRouter(); // Initialize useRouter

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;

        script.onload = () => {
            setIsPaystackReady(true);
        };

        document.body.appendChild(script);

        return () => {
            if (script) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handlePayment = () => {
        if (!isPaystackReady) return;

        const reference = `ref-${title.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`;
        const amount = parseFloat(price.replace(/[^0-9.-]+/g, "")) * 100;

        const handler = window.PaystackPop.setup({
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxxxxxxxxxxxx",
            email,
            amount,
            currency: "ZAR",
            ref: reference,
            metadata: {
                plan: title,
                storage,
                users,
                priority_support: sendUp,
            },
            onClose: () => {
                console.log("Transaction was canceled");
                onCancel?.();
            },
            callback: (response: { reference: string }) => {
                console.log("Transaction successful", response.reference);

                // Trigger the onSuccess callback, if any
                onSuccess?.(response.reference);

                // Redirect to the dashboard page
                router.push("/sign-up");
            },
        });

        handler.openIframe();
    };

    return (
        <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>

            {/* Card container with minimum height for consistency */}
            <div className="relative bg-gray-900 text-white rounded-xl shadow-lg p-8 space-y-8 min-h-[400px]">
                {/* Header */}
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

                {/* Features */}
                <div className="space-y-4 text-base text-gray-300">
                    <p className="leading-relaxed">{storage}</p>
                    {sendUp && title !== "1 Year Access" && (
                        <p className="leading-relaxed">
                            Exclusive features and priority updates coming soon!
                        </p>
                    )}
                </div>

                {/* Action button */}
                <button
                    onClick={handlePayment}
                    disabled={!isPaystackReady}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isPaystackReady ? "Buy Now" : "Loading..."}
                </button>
            </div>
        </div>
    );
};

export default PricingCard;
