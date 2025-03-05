"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import "../../app/styles/styles.css";

// Detailed type definition for PayPal
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
}

interface PayPalButtons {
    (config: PayPalButtonConfig): {
        render: (selector: string) => Promise<void>
    }
}

// Declare global interface augmentation for window
declare global {
    interface Window {
        paypal?: {
            Buttons: PayPalButtons
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
    const paypalButtonRef = useRef<boolean>(false);

    // Generate a unique ID for each card's PayPal button container
    const paypalContainerId = `paypal-button-container-${title.replace(/\s+/g, '-').toLowerCase()}`;

    useEffect(() => {
        // Dynamically load PayPal script (only once)
        if (!window.paypal) {
            const script = document.createElement("script");
            // Updated PayPal script URL with additional parameters
            script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
            script.async = true;
            script.id = "paypal-script"; // Add an ID for easier reference

            script.onload = () => {
                if (window.paypal?.Buttons) {
                    setIsPayPalReady(true);
                    renderPayPalButtons();
                }
            };

            document.body.appendChild(script);

            // No cleanup function - we want PayPal to stay loaded
            // This avoids the "removeChild" error
        } else {
            // If PayPal script is already loaded
            setIsPayPalReady(true);
            renderPayPalButtons();
        }
    }, []);

    const renderPayPalButtons = () => {
        // Prevent multiple button renders
        if (!isPayPalReady || !window.paypal?.Buttons || paypalButtonRef.current) return;

        // Parse the price - handle both $ and R currency symbols
        const numericPrice = price.replace(/[^0-9.-]+/g, "");
        const amount = parseFloat(numericPrice);

        if (isNaN(amount)) {
            console.error("Invalid price format:", price);
            return;
        }

        // Clear any existing buttons in the container
        const container = document.getElementById(paypalContainerId);
        if (container) {
            container.innerHTML = '';
        }

        try {
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
                        
                        onSuccess?.(details.id);
                        router.push("/sign-up");
                    });
                },
                onCancel: () => {
                    console.log("Transaction was canceled");
                    paypalButtonRef.current = false;
                    onCancel?.();
                },
                onError: (err) => {
                    console.error("PayPal Error:", err);
                    paypalButtonRef.current = false;
                    onCancel?.();
                }
            }).render(`#${paypalContainerId}`);

            // Mark as rendered
            paypalButtonRef.current = true;
        } catch (error) {
            console.error("Error setting up PayPal buttons:", error);
            paypalButtonRef.current = false;
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

                {/* Updated PayPal button container - no custom button */}
                <div id={paypalContainerId} className="w-full">
                    {!isPayPalReady && (
                        <div className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg text-center">
                            Loading payment options...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PricingCard;
