import { useState, useEffect, useCallback, useRef } from "react";

interface PayPalApproveData {
    payer: {
        name: {
            given_name: string;
        };
    };
    id: string;
    status: string;
    purchase_units: unknown[];
}

type PayPalActions = any; // Replace with proper type if available from PayPal SDK

type PricingCardProps = {
    title: string;
    price: string;
};

const PricingCard: React.FC<PricingCardProps> = ({ title, price }) => {
    const [isPayPalReady, setIsPayPalReady] = useState(false);
    const [showPayPalButtons, setShowPayPalButtons] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const paypalButtonRef = useRef(false);

    const logInfo = useCallback((message: string, data?: unknown) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message,
            data: data || null,
            cardTitle: title,
            price
        };
        console.log("PAYPAL_LOG:", JSON.stringify(logEntry));
    }, [title, price]);

    useEffect(() => {
        if (!window.paypal) {
            const script = document.createElement("script");
            script.src = "https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID";
            script.async = true;
            script.onload = () => setIsPayPalReady(true);
            script.onerror = () => setErrorMessage("Failed to load PayPal SDK");
            document.body.appendChild(script);
        } else {
            setIsPayPalReady(true);
        }
    }, []);

    const createOrder = async () => {
        try {
            logInfo("Creating PayPal order");
            return "ORDER_ID"; // Replace with actual order creation logic
        } catch (error) {
            logInfo("Error creating order", { error: error instanceof Error ? error.message : error });
            setErrorMessage(`Failed to create PayPal order: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    };

    const onApprove = (data: PayPalApproveData, actions: PayPalActions) => {
        logInfo("Payment approved", data);
    };

    const onCancel = (data: unknown) => {
        logInfo("Payment cancelled", data);
    };

    const onError = (error: Error) => {
        logInfo("Payment error", { error: error.message });
        setErrorMessage(`Payment error: ${error.message}`);
    };

    const renderPayPalButtons = useCallback(() => {
        if (paypalButtonRef.current || !isPayPalReady) return;
        
        logInfo("Rendering PayPal buttons");
        
        window.paypal.Buttons({
            createOrder,
            onApprove,
            onCancel,
            onError,
        }).render("#paypal-button-container");
        
        paypalButtonRef.current = true;
    }, [isPayPalReady, logInfo]);

    useEffect(() => {
        if (isPayPalReady && showPayPalButtons) {
            renderPayPalButtons();
        }
    }, [isPayPalReady, showPayPalButtons, renderPayPalButtons]);

    return (
        <div>
            <h2>{title}</h2>
            <p>{price}</p>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            <button onClick={() => setShowPayPalButtons(true)}>Buy Now</button>
            {showPayPalButtons && <div id="paypal-button-container"></div>}
        </div>
    );
};

export default PricingCard;
