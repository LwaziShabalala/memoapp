"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../app/styles/styles.css";

// PayPal interfaces for Subscriptions
interface PayPalOrderDetails {
    payer: {
        name: {
            given_name: string;
        }
    };
    id: string;
}

interface PayPalSubscriptionData {
    subscriptionID: string;
}

interface PayPalButtonConfig {
    createSubscription?: (data: unknown, actions: {
        subscription: {
            create: (details: {
                plan_id: string;
                custom_id?: string;
                application_context?: {
                    shipping_preference: string;
                    user_action: string;
                    return_url: string;
                    cancel_url: string;
                };
            }) => Promise<string>
        }
    }) => Promise<string>;
    createOrder?: (data: unknown, actions: {
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
    onApprove: (data: PayPalSubscriptionData | unknown, actions?: {
        order?: {
            capture: () => Promise<PayPalOrderDetails>
        }
    }) => Promise<void>;
    onCancel: () => void;
    onError: (err: Error) => void;
}

// Declare global interface augmentation for window
declare global {
    interface Window {
        paypal?: {
            Buttons: (config: PayPalButtonConfig) => {
                render: (selector: string) => Promise<void>
            }
        }
    }
}

// Plan Types
type PlanType = 'MONTHLY' | 'YEARLY' | 'ONE_TIME';

// PricingCard Props Interface
interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    storage: string;
    users: string;
    sendUp: boolean;
    planType: PlanType;
    planId?: string; // PayPal subscription plan ID
    onSuccess?: (subscriptionId: string) => void;
    onCancel?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    originalPrice,
    storage,
    users, 
    sendUp,
    planType,
    planId,
    onSuccess,
    onCancel
}) => {
    const [isPayPalReady, setIsPayPalReady] = useState(false);
    const [showPayPalModal, setShowPayPalModal] = useState(false);
    const router = useRouter();

    // Modal container ID
    const modalContainerId = `paypal-modal-container-${title.replace(/\s+/g, '-').toLowerCase()}`;

    const closePayPalModal = () => {
        setShowPayPalModal(false);
        onCancel?.();
    };

    useEffect(() => {
        // Dynamically load PayPal script with subscription capability
        if (!window.paypal) {
            const script = document.createElement("script");
            // Add vault=true for subscriptions and intent=subscription
            script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=subscription&vault=true`;
            script.async = true;
            
            script.onload = () => {
                if (window.paypal?.Buttons) {
                    setIsPayPalReady(true);
                }
            };

            document.body.appendChild(script);
        } else {
            // If PayPal script is already loaded
            setIsPayPalReady(true);
        }

        // Add event listener to handle escape key closing the modal
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showPayPalModal) {
                closePayPalModal();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        
        // Add body class to prevent scrolling when modal is open
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
        
        setTimeout(() => {
            initializePayPalButtons();
        }, 100);
    };

    const initializePayPalButtons = () => {
        // Check if PayPal is defined
        if (!window.paypal || typeof window.paypal.Buttons !== 'function') {
            console.error("PayPal is not properly loaded");
            closePayPalModal();
            return;
        }

        // Clear any existing buttons in the container
        const container = document.getElementById(`paypal-button-${modalContainerId}`);
        if (container) {
            container.innerHTML = '';
        }

        try {
            let paypalButtonConfig: PayPalButtonConfig;

            if (planType === 'ONE_TIME') {
                // One-time payment logic (existing)
                const numericPrice = price.replace(/[^0-9.-]+/g, "");
                const amount = parseFloat(numericPrice);

                if (isNaN(amount)) {
                    console.error("Invalid price format:", price);
                    return;
                }

                paypalButtonConfig = {
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
                        if (actions?.order) {
                            return actions.order.capture().then((details: PayPalOrderDetails) => {
                                console.log("Transaction completed by " + details.payer.name.given_name);
                                
                                // Close the modal
                                setShowPayPalModal(false);
                                
                                // Notify parent component of success
                                onSuccess?.(details.id);
                                router.push("/sign-up");
                            });
                        }
                        return Promise.resolve();
                    },
                    onCancel: () => {
                        console.log("Transaction was canceled");
                        closePayPalModal();
                    },
                    onError: (err) => {
                        console.error("PayPal Error:", err);
                        closePayPalModal();
                    }
                };
            } else {
                // Subscription payment logic
                if (!planId) {
                    console.error("Plan ID is required for subscriptions");
                    closePayPalModal();
                    return;
                }

                paypalButtonConfig = {
                    createSubscription: (_, actions) => {
                        return actions.subscription.create({
                            plan_id: planId,
                            application_context: {
                                shipping_preference: "NO_SHIPPING",
                                user_action: "SUBSCRIBE_NOW",
                                return_url: window.location.href,
                                cancel_url: window.location.href
                            }
                        });
                    },
                    onApprove: (data: PayPalSubscriptionData | unknown) => {
                        // Type guard for subscription data
                        const subscriptionData = data as PayPalSubscriptionData;
                        
                        // Subscription was approved
                        console.log("Subscription approved: ", subscriptionData);
                        
                        // Close the modal
                        setShowPayPalModal(false);
                        
                        // Notify parent component of success with the subscription ID
                        if (subscriptionData.subscriptionID) {
                            onSuccess?.(subscriptionData.subscriptionID);
                        }
                        router.push("/sign-up");
                        
                        return Promise.resolve();
                    },
                    onCancel: () => {
                        console.log("Subscription was canceled");
                        closePayPalModal();
                    },
                    onError: (err) => {
                        console.error("PayPal Error:", err);
                        closePayPalModal();
                    }
                };
            }

            const paypalButtons = window.paypal.Buttons(paypalButtonConfig);
            
            if (paypalButtons && typeof paypalButtons.render === 'function') {
                paypalButtons.render(`#paypal-button-${modalContainerId}`);
            } else {
                throw new Error("PayPal buttons render function not available");
            }
        } catch (error) {
            console.error("Error setting up PayPal buttons:", error);
            closePayPalModal();
        }
    };

    const getPlanTypeLabel = () => {
        switch (planType) {
            case 'MONTHLY':
                return 'per month';
            case 'YEARLY':
                return 'per year';
            default:
                return '';
        }
    };

    // Modal JSX
    const payPalModal = showPayPalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative min-h-[200px] bg-white rounded-lg p-6 w-full max-w-md">
                {/* Close button - fixed to top right */}
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
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Complete Your {planType !== 'ONE_TIME' ? 'Subscription' : 'Payment'}</h3>
                    <div className="text-center mb-4">
                        <h4 className="font-bold text-lg">{title}</h4>
                        <p className="text-2xl font-bold">
                            {price} {planType !== 'ONE_TIME' && <span className="text-sm font-normal">{getPlanTypeLabel()}</span>}
                        </p>
                    </div>
                </div>
                
                {/* PayPal button container - will expand to needed height */}
                <div id={`paypal-button-${modalContainerId}`} className="w-full overflow-visible" style={{ minHeight: '200px' }}></div>
                
                {/* Extra space at the bottom to ensure visibility */}
                <div className="h-6"></div>
            </div>
        </div>
    );

    return (
        <>
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
                            <div className="text-center">
                                <p className="text-4xl font-extrabold text-white">{price}</p>
                                {planType !== 'ONE_TIME' && 
                                    <p className="text-sm text-gray-400">{getPlanTypeLabel()}</p>
                                }
                            </div>
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
                            disabled={!isPayPalReady || (planType !== 'ONE_TIME' && !planId)}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
                        >
                            {!isPayPalReady ? "Loading..." : 
                             (planType !== 'ONE_TIME' && !planId) ? "Plan ID Required" : "Get Started Now"}
                        </button>
                    </div>
                </div>
            </div>

            {/* PayPal Modal */}
            {payPalModal}
        </>
    );
};

export default PricingCard;
