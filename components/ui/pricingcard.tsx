"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PricingCardProps {
    title: string;
    priceUSD: number; // Base price in USD
    originalPriceUSD?: number;
    storage: string;
    users: string;
    sendUp: boolean;
    email?: string;
    onSuccess?: (reference: string) => void;
    onCancel?: () => void;
}

interface CurrencyInfo {
    code: string;
    symbol: string;
    rate: number;
}

const CURRENCY_MAP: Record<string, CurrencyInfo> = {
    ZA: { code: 'ZAR', symbol: 'R', rate: 19.22 }, // South African Rand
    US: { code: 'USD', symbol: '$', rate: 1 },
    GB: { code: 'GBP', symbol: '£', rate: 0.80 },
    EU: { code: 'EUR', symbol: '€', rate: 0.93 },
    // Add more currencies as needed
};

export const PricingCard: React.FC<PricingCardProps> = ({
    title,
    priceUSD,
    originalPriceUSD,
    storage,
    users,
    sendUp,
    email = "test@example.com",
    onSuccess,
    onCancel
}) => {
    const [isPaystackReady, setIsPaystackReady] = useState(false);
    const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>(CURRENCY_MAP.ZA);
    const router = useRouter();

    useEffect(() => {
        // Load Paystack script
        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;
        script.onload = () => setIsPaystackReady(true);
        document.body.appendChild(script);

        // Detect user's location
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                const countryCode = data.country_code;
                const defaultCurrency = CURRENCY_MAP[countryCode] || CURRENCY_MAP.ZA;
                setCurrencyInfo(defaultCurrency);
            })
            .catch(error => {
                console.error('Error detecting location:', error);
                setCurrencyInfo(CURRENCY_MAP.ZA); // Default to ZAR if detection fails
            });

        return () => {
            if (script) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const formatPrice = (amount: number): string => {
        const convertedAmount = amount * currencyInfo.rate;
        return `${currencyInfo.symbol}${convertedAmount.toFixed(2)}`;
    };

    const handlePayment = () => {
        if (!isPaystackReady) return;

        const convertedAmount = priceUSD * currencyInfo.rate;
        const reference = `ref-${title.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`;

        const handler = window.PaystackPop.setup({
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxxxxxxxxxxxx",
            email,
            amount: convertedAmount * 100,
            currency: currencyInfo.code,
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
                onSuccess?.(response.reference);
                router.push("/sign-up");
            },
        });

        handler.openIframe();
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
                        {originalPriceUSD && (
                            <span className="text-xl text-gray-400 line-through">
                                {formatPrice(originalPriceUSD)}
                            </span>
                        )}
                        <p className="text-4xl font-extrabold text-white">
                            {formatPrice(priceUSD)}
                        </p>
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
