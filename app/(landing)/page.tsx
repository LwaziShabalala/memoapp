"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { LandingHero } from "@/components/landing-hero";
import LandingNavbar from "@/components/landing-navbar";
import PricingCard from "@/components/ui/pricingcard";
import VideoComponent from "@/components/landing-video";
import FeaturesSection from "@/components/landing-features";
import VirtualizedWrapper from '@/components/virtualized-wrapper';

const LandingPage = () => {
    const { user, isLoaded } = useUser();
    const [userEmail, setUserEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    useEffect(() => {
        if (isLoaded && user) {
            // Get email from Clerk user
            setUserEmail(user.primaryEmailAddress?.emailAddress || "");
        }
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

    return (
        <VirtualizedWrapper>
            <div className="min-h-screen bg-gray-950">
                <LandingNavbar />
                <section className="py-16">
                    <LandingHero />
                </section>
                <section className="-mt-8 w-full py-12">
                    <h2 className="text-2xl font-bold text-gray-200 mb-8 text-center">
                        See how it works
                    </h2>
                    <div className="max-w-4xl mx-auto px-8">
                        <VideoComponent />
                    </div>
                </section>
                <FeaturesSection />
                
                {/* Pricing Section with Email Validation */}
                <section className="max-w-4xl mx-auto px-4 py-20">
                    <h2 className="text-3xl font-bold text-gray-200 mb-6 text-center">
                        Choose Your Plan
                    </h2>
                    
                    {!user && (
                        <div className="max-w-md mx-auto mb-6 text-center">
                            <p className="text-sm text-gray-400">
                                Enter your email to receive exclusive updates and a smoother checkout experience.
                            </p>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={userEmail}
                                onChange={handleEmailChange}
                                className={`w-full mt-2 p-3 border ${
                                    emailError ? "border-red-500" : "border-gray-600"
                                } rounded-md bg-gray-900 text-white focus:ring-2 focus:ring-indigo-500`}
                            />
                            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <PricingCard
                            title="1-year access"
                            originalPrice="R500"
                            price="R250"
                            storage="Join now and get early access to exclusive updates and features."
                            users="Be among the first to experience advanced transcription tools and AI-powered features!"
                            sendUp={true}
                            email={emailError ? "" : userEmail} // Prevent sending an invalid email
                        />
                        <PricingCard
                            title="Lifetime Access"
                            originalPrice="R1000"
                            price="R500"
                            storage="Secure lifetime access with exclusive perks and continuous updates."
                            users="Enjoy permanent access to new features, including priority support and more!"
                            sendUp={true}
                            email={emailError ? "" : userEmail} // Prevent sending an invalid email
                        />
                    </div>
                </section>
            </div>
        </VirtualizedWrapper>
    );
};

export default LandingPage;
