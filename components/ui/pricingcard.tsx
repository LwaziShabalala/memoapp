"use client";

import React, { useEffect, useRef } from "react";
import "../../app/styles/styles.css";

interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    storage: string;
    users: string;
    sendUp: boolean;
    gumroadProductId: string; // New prop for Gumroad product ID
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
    gumroadProductId,
    onSuccess,
    onCancel
}) => {
    const gumroadButtonRef = useRef<HTMLDivElement>(null);
    const buttonId = `gumroad-button-${title.replace(/\s+/g, '-').toLowerCase()}`;

    useEffect(() => {
        // Add Gumroad script if it doesn't exist
        if (!document.getElementById('gumroad-script')) {
            const script = document.createElement("script");
            script.src = "https://gumroad.com/js/gumroad.js";
            script.async = true;
            script.id = "gumroad-script";
            document.body.appendChild(script);
            
            // Initialize Gumroad after script is loaded
            script.onload = () => {
                if (window.GumroadOverlay) {
                    // Initialize Gumroad overlay functionality
                    window.GumroadOverlay.init();
                }
            };
        } else if (window.GumroadOverlay) {
            // If script already exists, just initialize
            window.GumroadOverlay.init();
        }
    }, []);

    // Define the type for the GumroadOverlay object
    declare global {
        interface Window {
            GumroadOverlay?: {
                init: () => void;
            }
        }
    }

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

                <div ref={gumroadButtonRef} className="w-full">
                    <a 
                        id={buttonId}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg flex items-center justify-center cursor-pointer"
                        href={`https://gumroad.com/l/${gumroadProductId}`}
                        data-gumroad-overlay="true"
                        data-gumroad-single-product="true"
                    >
                        Get Started Now
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PricingCard;
