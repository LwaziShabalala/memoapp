"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import PricingCard from "../../../components/ui/pricingcard";

const PaymentWall = () => {
    const { user, isLoaded } = useUser();
    const [userEmail, setUserEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isLoaded && user) {
            setUserEmail(user.primaryEmailAddress?.emailAddress || "");
        }
        setIsLoading(false);
    }, [isLoaded, user]);

    // Function to validate email format
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Handle email input change
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const email = e.target.value;
        setUserEmail(email);

        // Validate email and show error if invalid
        if (!validateEmail(email) && email.length > 0) {
            setEmailError("Please enter a valid email address.");
        } else {
            setEmailError("");
        }
    };

    const handleSuccess = (reference: string) => {
        console.log("Payment successful, reference:", reference);
        // Here you can implement additional logic like:
        // - Storing the payment information in your database
        // - Redirecting to a thank you page
        // - Updating user permissions/access
    };

    const handleCancel = () => {
        console.log("Payment was canceled");
        // Handle cancellation logic if needed
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="text-center py-20 space-y-8">
            <h1 className="text-4xl font-bold text-gray-800">Choose Your Payment Option</h1>
            <p className="text-xl text-gray-600">
                Please choose one of the following payment options to proceed.
            </p>

            {/* Email input if user is not logged in */}
            {!user && (
                <div className="max-w-md mx-auto">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left mb-1">
                        Email address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={userEmail}
                        onChange={handleEmailChange}
                        placeholder="Enter your email address"
                        className={`w-full p-3 border ${
                            emailError ? "border-red-500" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        required
                    />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                </div>
            )}

            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="flex flex-col h-full">
                    <PricingCard
                        title="1-year access"
                        originalPrice="R500"
                        price="R250"
                        storage="Join now and get early access to exclusive updates and features."
                        users="Be among the first to experience advanced transcription tools and AI-powered features!"
                        sendUp={true}
                        email={emailError ? "" : userEmail} // Prevent sending an invalid email
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
                <div className="flex flex-col h-full">
                    <PricingCard
                        title="Lifetime Access"
                        originalPrice="R1000"
                        price="R500"
                        storage="Secure lifetime access with exclusive perks and continuous updates."
                        users="Enjoy permanent access to new features, including priority support and more!"
                        sendUp={true}
                        email={emailError ? "" : userEmail} // Prevent sending an invalid email
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
            <p className="text-sm text-gray-400 mt-8">
                By selecting a plan, you agree to our terms of service and privacy policy.
            </p>
        </div>
    );
};

export default PaymentWall;
