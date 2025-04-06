"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../app/styles/styles.css";

// PayPal interfaces
interface PayPalButtonConfig {
    createOrder: (data: unknown, actions: {
        order: {
            create: (details: {
                purchase_units: Array<{
                    amount: {
                        value: string;
                        currency_code: string;
                    };
                    description?: string;
                    custom_id?: string;
                }>
                application_context?: {
                    shipping_preference?: string;
                    user_action?: string;
                    return_url?: string;
                    cancel_url?: string;
                }
            }) => Promise<string>
        }
    }) => Promise<string>;
    onApprove: (data: unknown, actions: {
        order: {
            capture: () => Promise<{
                payer: {
                    name: {
                        given_name: string;
                    }
                }
                id: string;
            }>
        }
    }) => Promise<void>;
    onCancel: () => void;
    onError: (err: Error) => void;
    fundingSource?: string;
}

// Declare global interface augmentation for window
declare global {
    interface Window {
        paypal?: {
            Buttons: (config: PayPalButtonConfig) => {
                render: (selector: string) => Promise<void>
            },
            FUNDING: {
                CARD: string;
                PAYPAL: string;
            }
        }
    }
}

// PricingCard Props Interface
interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    storage: string;
    users: string;
    sendUp: boolean;
    onSuccess?: (paymentId: string) => void;
    onCancel?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    originalPrice,
    storage,
    users,
    sendUp,
    onSuccess,
    onCancel
}) => {
    const [isPayPalReady, setIsPayPalReady] = useState(false);
    const router = useRouter();

    // Direct checkout without modal
    useEffect(() => {
        if (!window.paypal) {
            const script = document.createElement("script");
            // Adding important parameters for redirect behavior
            script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&commit=true&intent=capture`;
            script.async = true;
            script.onload = () => {
                if (window.paypal?.Buttons) {
                    setIsPayPalReady(true);
                }
            };
            document.body.appendChild(script);
        } else {
            setIsPayPalReady(true);
        }
    }, []);

    const handlePurchase = () => {
        // Get the numeric value from price string
        const numericPrice = price.replace(/[^0-9.-]+/g, "");
        const amount = parseFloat(numericPrice);

        if (isNaN(amount)) {
            console.error("Invalid price format:", price);
            return;
        }

        // Create a direct form submission to PayPal checkout
        const form = document.createElement('form');
        form.method = 'post';
        form.action = 'https://www.paypal.com/cgi-bin/webscr';
        
        // Create hidden fields
        const addField = (name: string, value: string) => {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = name;
            hiddenField.value = value;
            form.appendChild(hiddenField);
        };
        
        // Add required PayPal fields
        addField('cmd', '_xclick');
        addField('business', process.env.NEXT_PUBLIC_PAYPAL_BUSINESS_EMAIL || ''); // Your PayPal email
        addField('item_name', `${title} - ${storage}`);
        addField('amount', amount.toFixed(2));
        addField('currency_code', 'USD');
        addField('return', `${window.location.origin}/sign-up`); // Success URL
        addField('cancel_return', window.location.href); // Cancel URL
        
        // Add to document, submit, and remove
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
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
                    <p className="leading-relaxed text-sm text-gray-400">{users}</p>
                    {sendUp && title !== "1 Year Access" && (
                        <p className="leading-relaxed">
                            Exclusive features and priority updates coming soon!
                        </p>
                    )}
                </div>

                <div className="w-full">
                    <button 
                        onClick={handlePurchase}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
                    >
                        {!isPayPalReady ? "Loading..." : "Get Started Now"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PricingCard;
