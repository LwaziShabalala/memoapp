"use client";

import React, { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "../../app/styles/styles.css";

// PricingCard Props Interface
interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    storage: string;
    users: string;
    sendUp: boolean;
    gumroadUrl: string; // Gumroad product ID or full URL
    onSuccess?: (purchaseId: string) => void;
    onCancel?: () => void;
    redirectPath?: string; // Allow customization of redirect path
}

// Define the Gumroad event type with specific properties
interface GumroadPurchaseDetail {
    purchaseId: string;
    productId: string;
    price: number;
    currency: string;
    sellerName?: string;
    productName?: string;
    affiliateId?: string;
    orderId?: string;
}

interface GumroadPurchaseEvent extends CustomEvent {
    detail: GumroadPurchaseDetail;
}

declare global {
    interface WindowEventMap {
        gumroadPurchase: GumroadPurchaseEvent;
    }
}

export const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    originalPrice,
    storage,
    users, 
    sendUp,
    gumroadUrl,
    onSuccess,
    onCancel,
    redirectPath = '/sign-up' // Default redirect path
}) => {
    const router = useRouter();
    
    // Extract product ID from Gumroad URL if it's a full URL
    const getProductId = (url: string) => {
        // Handle both formats: full URLs and just product IDs
        if (url.includes('gumroad.com')) {
            const parts = url.split('/');
            return parts[parts.length - 1];
        }
        return url;
    };
    
    // Create a stable redirect function
    const handleRedirect = useCallback((purchaseId?: string) => {
        console.log('Redirecting to sign-up page...');
        
        // If onSuccess callback is provided, call it
        if (onSuccess && purchaseId) {
            onSuccess(purchaseId);
        }
        
        // Store purchase info in localStorage for recovery if redirect fails
        if (purchaseId) {
            localStorage.setItem('lastPurchaseId', purchaseId);
            localStorage.setItem('pendingRedirect', redirectPath);
        }
        
        // Perform the redirect
        router.push(redirectPath);
    }, [onSuccess, redirectPath, router]);
    
    useEffect(() => {
        // Check if there's a pending redirect from a previous session
        const pendingRedirect = localStorage.getItem('pendingRedirect');
        const lastPurchaseId = localStorage.getItem('lastPurchaseId');
        
        if (pendingRedirect === redirectPath && lastPurchaseId) {
            // Clear the pending redirect
            localStorage.removeItem('pendingRedirect');
            
            // Call onSuccess with the stored purchase ID
            if (onSuccess) {
                onSuccess(lastPurchaseId);
            }
        }
        
        // Load Gumroad JS script once
        if (typeof window !== 'undefined' && !document.getElementById('gumroad-script')) {
            const script = document.createElement('script');
            script.src = 'https://gumroad.com/js/gumroad.js';
            script.id = 'gumroad-script';
            script.async = true;
            document.body.appendChild(script);
            
            // Function to handle purchase event
            const handlePurchaseEvent = (event: GumroadPurchaseEvent) => {
                console.log('Purchase completed:', event.detail);
                
                // Clear any stored purchase info
                localStorage.removeItem('lastPurchaseId');
                localStorage.removeItem('pendingRedirect');
                
                // Wait a moment to make sure Gumroad processes finish
                setTimeout(() => {
                    handleRedirect(event.detail.purchaseId);
                }, 1000);
            };
            
            // Listen for Gumroad purchase events
            window.addEventListener('gumroadPurchase', handlePurchaseEvent);
            
            // Also listen for the success message in the URL (alternative method)
            const checkUrlForSuccess = () => {
                if (window.location.search.includes('success=true')) {
                    // Extract purchase ID from URL if available
                    const urlParams = new URLSearchParams(window.location.search);
                    const purchaseId = urlParams.get('purchase_id') || '';
                    
                    // Redirect to sign-up page
                    handleRedirect(purchaseId);
                }
            };
            
            // Check URL immediately and also set up an interval to check
            checkUrlForSuccess();
            const intervalId = setInterval(checkUrlForSuccess, 500);
            
            // Cleanup event listener and interval on unmount
            return () => {
                if (typeof window !== 'undefined') {
                    window.removeEventListener('gumroadPurchase', handlePurchaseEvent);
                    clearInterval(intervalId);
                }
            };
        }
        
        return undefined;
    }, [handleRedirect, onSuccess, redirectPath]);

    const handlePurchase = () => {
        const productId = getProductId(gumroadUrl);
        // Using Gumroad's data attributes for overlay functionality
        const buyButton = document.createElement('a');
        buyButton.className = 'gumroad-button';
        buyButton.href = `https://gumroad.com/l/${productId}`;
        buyButton.setAttribute('data-gumroad-overlay-checkout', 'true');
        buyButton.setAttribute('data-gumroad-success-redirect', `${window.location.origin}${redirectPath}`);
        
        // Additional query parameters for tracking
        buyButton.setAttribute('data-gumroad-success-query', 'success=true');
        
        // Append to body temporarily and click
        document.body.appendChild(buyButton);
        buyButton.click();
        
        // Remove after click
        setTimeout(() => {
            document.body.removeChild(buyButton);
        }, 100);
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
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:opacity-90 transition duration-300"
                    >
                        Get Started Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PricingCard;
