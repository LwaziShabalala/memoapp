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
    onApprove: (data: any, actions: {
        order: {
            capture: () => Promise<{
                payer: {
                    name: {
                        given_name: string;
                    }
                }
                id: string;
                status: string;
                purchase_units: any[];
            }>
        }
    }) => Promise<void>;
    onCancel: (data: any) => void;
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
    const [showPayPalButtons, setShowPayPalButtons] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();
    const paypalButtonRef = useRef<boolean>(false);

    // Generate a unique ID for each card's PayPal button container
    const paypalContainerId = `paypal-button-container-${title.replace(/\s+/g, '-').toLowerCase()}`;

    // Logger function
    const logInfo = (message: string, data?: any) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message,
            data: data || null,
            cardTitle: title,
            price
        };
        console.log("PAYPAL_LOG:", JSON.stringify(logEntry));
    };

    useEffect(() => {
        // Dynamically load PayPal script (only once)
        if (!window.paypal) {
            const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
            logInfo(`Loading PayPal script with client ID: ${clientId?.substring(0, 5)}...`);
            
            const script = document.createElement("script");
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&debug=true`;
            script.async = true;
            script.id = "paypal-script";

            script.onload = () => {
                if (window.paypal?.Buttons) {
                    logInfo("PayPal script loaded successfully");
                    setIsPayPalReady(true);
                } else {
                    const errorMsg = "PayPal script loaded but Buttons API is not available";
                    logInfo(errorMsg);
                    setErrorMessage(errorMsg);
                }
            };

            script.onerror = (error) => {
                const errorMsg = "Failed to load PayPal script";
                logInfo(errorMsg, error);
                setErrorMessage(errorMsg);
            };

            document.body.appendChild(script);
        } else {
            // If PayPal script is already loaded
            logInfo("PayPal script was already loaded");
            setIsPayPalReady(true);
        }
    }, []);

    useEffect(() => {
        // Only render PayPal buttons when they should be shown
        if (isPayPalReady && showPayPalButtons) {
            logInfo("Attempting to render PayPal buttons");
            renderPayPalButtons();
        }
    }, [isPayPalReady, showPayPalButtons]);

    const renderPayPalButtons = () => {
        // Prevent multiple button renders
        if (!window.paypal?.Buttons) {
            logInfo("PayPal Buttons API not available when trying to render");
            return;
        }
        
        if (paypalButtonRef.current) {
            logInfo("Buttons already rendered, skipping");
            return;
        }

        // Parse the price - handle both $ and R currency symbols
        const numericPrice = price.replace(/[^0-9.-]+/g, "");
        const amount = parseFloat(numericPrice);

        if (isNaN(amount)) {
            const errorMsg = `Invalid price format: ${price}`;
            logInfo(errorMsg);
            setErrorMessage(errorMsg);
            return;
        }

        logInfo(`Parsed price amount: ${amount}`);

        // Clear any existing buttons in the container
        const container = document.getElementById(paypalContainerId);
        if (!container) {
            const errorMsg = `Container not found: #${paypalContainerId}`;
            logInfo(errorMsg);
            setErrorMessage(errorMsg);
            return;
        }
        
        container.innerHTML = '';
        logInfo("Container cleared, preparing to render buttons");

        try {
            window.paypal.Buttons({
                // Log the configuration
                style: {
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'pay'
                },
                createOrder: (data, actions) => {
                    logInfo("createOrder called", { data });
                    
                    const orderConfig = {
                        purchase_units: [{
                            amount: {
                                value: amount.toFixed(2),
                                currency_code: "USD"
                            },
                            description: `${title} - ${storage}`
                        }]
                    };
                    
                    logInfo("Creating order with config", orderConfig);
                    return actions.order.create(orderConfig)
                        .then(orderId => {
                            logInfo("Order created successfully", { orderId });
                            return orderId;
                        })
                        .catch(error => {
                            logInfo("Error creating order", { error: error.toString(), details: error });
                            setErrorMessage(`Failed to create PayPal order: ${error.message || error}`);
                            throw error;
                        });
                },
                onApprove: (data, actions) => {
                    logInfo("onApprove called", { data });
                    
                    return actions.order.capture()
                        .then((details) => {
                            logInfo("Payment captured successfully", { 
                                payerId: details.payer?.name?.given_name,
                                orderId: details.id,
                                status: details.status,
                                details: details
                            });
                            
                            onSuccess?.(details.id);
                            router.push("/sign-up");
                        })
                        .catch(error => {
                            logInfo("Error capturing payment", { error: error.toString(), details: error });
                            setErrorMessage(`Failed to process payment: ${error.message || error}`);
                            paypalButtonRef.current = false;
                            throw error;
                        });
                },
                onCancel: (data) => {
                    logInfo("Transaction was canceled by user", { data });
                    paypalButtonRef.current = false;
                    setShowPayPalButtons(false);
                    onCancel?.();
                },
                onError: (err) => {
                    const errorMsg = err.message || err.toString();
                    logInfo("PayPal Error", { error: errorMsg, details: err });
                    setErrorMessage(`PayPal Error: ${errorMsg}`);
                    paypalButtonRef.current = false;
                    setShowPayPalButtons(false);
                    onCancel?.();
                }
            }).render(`#${paypalContainerId}`)
            .then(() => {
                logInfo("PayPal buttons rendered successfully");
                // Mark as rendered
                paypalButtonRef.current = true;
            })
            .catch(error => {
                const errorMsg = `Failed to render PayPal buttons: ${error.message || error}`;
                logInfo(errorMsg, { error });
                setErrorMessage(errorMsg);
                paypalButtonRef.current = false;
                setShowPayPalButtons(false);
            });
        } catch (error: any) {
            const errorMsg = `Error setting up PayPal buttons: ${error.message || error}`;
            logInfo(errorMsg, { error });
            setErrorMessage(errorMsg);
            paypalButtonRef.current = false;
            setShowPayPalButtons(false);
        }
    };

    const handleGetStarted = () => {
        logInfo("Get Started button clicked");
        setShowPayPalButtons(true);
        paypalButtonRef.current = false; // Reset to allow re-rendering
        setErrorMessage(null); // Clear any previous errors
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

                {/* Display any error messages */}
                {errorMessage && (
                    <div className="text-red-400 text-sm bg-red-900 bg-opacity-30 p-2 rounded">
                        Error: {errorMessage}
                    </div>
                )}

                {showPayPalButtons ? (
                    <div id={paypalContainerId} className="w-full">
                        <div className="w-full py-4 text-center text-white">
                            Loading payment options...
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={handleGetStarted}
                        disabled={!isPayPalReady}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg"
                    >
                        {isPayPalReady ? "Get Started Now" : "Loading..."}
                    </button>
                )}

                {/* Back button when showing PayPal */}
                {showPayPalButtons && (
                    <button 
                        onClick={() => {
                            logInfo("Back button clicked");
                            setShowPayPalButtons(false);
                            setErrorMessage(null);
                        }}
                        className="w-full mt-2 py-2 bg-transparent border border-gray-600 text-gray-400 font-medium rounded-lg text-sm"
                    >
                        Back to options
                    </button>
                )}
            </div>
        </div>
    );
};

export default PricingCard;
