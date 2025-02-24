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
    
    useEffect(() => {
        if (isLoaded && user) {
            // Get email from Clerk user
            setUserEmail(user.primaryEmailAddress?.emailAddress || "");
        }
    }, [isLoaded, user]);

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
                <section className="max-w-4xl mx-auto px-4 py-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <PricingCard
                            title="1-year access"
                            originalPrice="ZAR1000"
                            price="ZAR500"
                            storage="Join now and get early access to exclusive updates and features."
                            users="Be among the first to experience advanced transcription tools and AI-powered features!"
                            sendUp={true}
                            email={userEmail}
                        />
                        <PricingCard
                            title="Lifetime Access"
                            originalPrice="ZAR500"
                            price="ZAR250"
                            storage="Secure lifetime access with exclusive perks and continuous updates."
                            users="Enjoy permanent access to new features, including priority support and more!"
                            sendUp={true}
                            email={userEmail}
                        />
                    </div>
                </section>
            </div>
        </VirtualizedWrapper>
    );
};

export default LandingPage;
