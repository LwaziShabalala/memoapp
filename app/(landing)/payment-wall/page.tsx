"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import PricingCard from "../../../components/ui/pricingcard";
import { useRouter } from "next/navigation";

const PaymentWall = () => {
    const { isLoaded } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    
    useEffect(() => {
        if (isLoaded) {
            setIsLoading(false);
        }
    }, [isLoaded]);
    
    const handleSuccess = (paymentId: string) => {
        console.log("Payment successful, reference:", paymentId);
        router.push("/sign-up"); // Redirect to sign-up page after successful purchase
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
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="flex flex-col h-full">
                    <PricingCard
                        title="1-year access"
                        originalPrice="$50"
                        price="$25"
                        storage="Join now and get early access to exclusive updates and features."
                        users="Be among the first to experience advanced transcription tools and AI-powered features!"
                        sendUp={true}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
                <div className="flex flex-col h-full">
                    <PricingCard
                        title="Lifetime Access"
                        originalPrice="$150"
                        price="$50"
                        storage="Secure lifetime access with exclusive perks and continuous updates."
                        users="Enjoy permanent access to new features, including priority support and more!"
                        sendUp={true}
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
