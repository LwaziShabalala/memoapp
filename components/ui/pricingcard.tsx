"use client";

import React, { useEffect, useState } from "react";
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

interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    storage: string;
    users: string;
    sendUp: boolean;
    email: string;
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
    email,
    onSuccess,
    onCancel
}) => {
    const [isPayPalReady, setIsPayPalReady] = useState(false);
    const router = useRouter();

    // Generate a unique ID for each card's PayPal button container
    const paypalContainerId = `paypal-button-container-${title.replace(/\s+/g, '-').toLowerCase()}`;

    useEffect(() => {
        // Dynamically load PayPal script (only once)
        if (!window.paypal) {
            const script = document.createElement("script");
            script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
            script.async = true;

            script.onload = () => {
                if (window.paypal?.Buttons) {
                    setIsPayPalReady(true);
                }
            };

            document.body.appendChild(script);

            return () => {
                if (script) {
                    document.body.removeChild(script);
                }
            };
        } else {
            // If PayPal script is already loaded
            setIsPayPalReady(true);
        }
    }, []);

    const payWithPayPal = () => {
        if (!isPayPalReady || !window.paypal?.Buttons) return;

        const amount = parseFloat(price.replace(/[^0-9.-]+/g, ""));

        window.paypal.Buttons({
            createOrder: (_, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: amount.toFixed(2),
                            currency_code: "USD"
                        },
                        description: `${title} - ${storage}`,
                        custom_id: email
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
                onCancel?.();
            },
            onError: (err) => {
                console.error("PayPal Error:", err);
                onCancel?.();
            }
        }).render(`#${paypalContainerId}`);
    };

    // Rest of the component remains the same as in the previous example
    return (
        // ... (previous render method)
    );
};

export default PricingCard;
