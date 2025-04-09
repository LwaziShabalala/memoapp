"use client";

import React, { useEffect, useState, useCallback } from "react";
import Script from "next/script";
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
            capture: () => Promise<PayPalOrderDetails>
        }
    }) => Promise<void>;
    onCancel: () => void;
    onError: (err: Error) => void;
    style?: {
        layout?: string;
        color?: string;
        shape?: string;
        label?: string;
        height?: number;
    };
}

interface PayPalOrderDetails {
    payer: {
        name: {
            given_name: string;
            surname?: string;
        };
        email_address?: string;
    };
    id: string;
    purchase_units: Array<{
        amount: {
            value: string;
            currency_code: string;
        };
    }>;
    status: string;
}

declare global {
    interface Window {
        paypal?: {
            Buttons: (config: PayPalButtonConfig) => {
                render: (selector: string) => Promise<void>
            }
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
    onSuccess?: (paymentId: string, orderDetails: PayPalOrderDetails) => void;
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
    const [showPayPalModal, setShowPayPalModal] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const router = useRouter();

    const modalContainerId = `paypal-modal-container-${title.replace(/\s+/g, '-').toLowerCase()}`;

    const closePayPalModal = useCallback(() => {
        setShowPayPalModal(false);
        onCancel?.();
    }, [onCancel]);

    useEffect(() => {
        if (window.paypal?.Buttons) {
            setIsPayPalReady(true);
        }

        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showPayPalModal) {
                closePayPalModal();
            }
        };

        document.addEventListener('keydown', handleEscKey);

        if (showPayPalModal) {
            document.body.classList.add('overflow-hidden');
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.classList.remove('overflow-hidden');
        };
    }, [showPayPalModal, closePayPalModal]);

    const openPayPalModal = () => {
        if (!isPayPalReady || !window.paypal?.Buttons) return;
        setShowPayPalModal(true);
        setPaymentError(null);

        setTimeout(() => {
            initializePayPalButtons();
        }, 100);
    };

    const initializePayPalButtons = () => {
        const numericPrice = price.replace(/[^0-9.-]+/g, "");
        const amount = parseFloat(numericPrice);

        if (isNaN(amount)) {
            setPaymentError("Invalid price format. Please contact support.");
            return;
        }

        const container = document.getElementById(`paypal-button-${modalContainerId}`);
        if (container) {
            container.innerHTML = '';
        }

        try {
            window.paypal!.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'paypal',
                    height: 45
                },
                createOrder: (_, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: amount.toFixed(2),
                                currency_code: "USD"
                            },
                            description: `${title} - ${storage}`,
                            custom_id: `plan_${title.replace(/\s+/g, '_').toLowerCase()}`
                        }],
                        application_context: {
                            shipping_preference: 'NO_SHIPPING',
                            user_action: 'PAY_NOW',
                        }
                    });
                },
                onApprove: async (_data, actions) => {
                    try {
                        const orderDetails = await actions.order.capture();

                        try {
                            const response = await fetch('/api/payment/verify', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    orderId: orderDetails.id,
                                    paymentDetails: orderDetails,
                                    planTitle: title,
                                    planStorage: storage
                                }),
                            });

                            if (!response.ok) {
                                throw new Error('Failed to verify payment with server');
                            }

                            const result = await response.json();
                            console.log("Payment verified:", result);
                        } catch (error) {
                            console.error("Server verification error:", error);
                        }

                        setShowPayPalModal(false);
                        onSuccess?.(orderDetails.id, orderDetails);
                        router.push("/sign-up?payment=success&order=" + orderDetails.id);
                    } catch (error) {
                        setPaymentError("There was a problem processing your payment.");
                    }
                },
                onCancel: () => {
                    closePayPalModal();
                },
                onError: (err) => {
                    console.error("PayPal Error:", err);
                    setPaymentError("Payment processing error. Please try again later.");
                }
            }).render(`#paypal-button-${modalContainerId}`);
        } catch (error) {
            console.error("PayPal render error:", error);
            setPaymentError("Failed to load payment options.");
        }
    };

    const payPalModal = showPayPalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative min-h-[200px] bg-white rounded-lg p-6 w-full max-w-md">
                <button 
                    onClick={closePayPalModal}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 z-10"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mb-8 pt-2">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Complete Your Payment</h3>
                    <div className="text-center mb-4">
                        <h4 className="font-bold text-lg">{title}</h4>
                        <p className="text-2xl font-bold">{price}</p>
                    </div>

                    {paymentError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                            {paymentError}
                        </div>
                    )}
                </div>

                <div id={`paypal-button-${modalContainerId}`} className="w-full overflow-visible" style={{ minHeight: '200px' }}></div>
            </div>
        </div>
    );

    return (
        <>
            {/* Load PayPal SDK globally */}
            <Script
                src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&debug=true`}
                strategy="afterInteractive"
                onLoad={() => {
                    if (window.paypal?.Buttons) {
                        setIsPayPalReady(true);
                    }
                }}
                onError={(e) => {
                    console.error("PayPal SDK failed to load", e);
                    setPaymentError("Failed to load PayPal SDK. Please refresh the page.");
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

                    <div className="w-full">
                        <button 
                            onClick={openPayPalModal}
                            disabled={!isPayPalReady}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
                        >
                            {!isPayPalReady ? "Loading..." : "Get Started Now"}
                        </button>
                    </div>
                </div>
            </div>

            {payPalModal}
        </>
    );
};

export default PricingCard;
