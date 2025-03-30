"use client";
import { useUser } from "@clerk/nextjs";
import { LandingHero } from "@/components/landing-hero";
import LandingNavbar from "@/components/landing-navbar";
import PricingCard from "@/components/ui/pricingcard";
import VideoComponent from "@/components/landing-video";
import FeaturesSection from "@/components/landing-features";
import VirtualizedWrapper from '@/components/virtualized-wrapper';

const LandingPage = () => {
    useUser();
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
                    <div className="w-full">
                        <VideoComponent />
                    </div>
                </section>
                <FeaturesSection />

                {/* Pricing Section */}
                <section className="max-w-4xl mx-auto px-4 py-20">
                    <h2 className="text-3xl font-bold text-gray-200 mb-6 text-center">
                        Choose Your Plan
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <PricingCard
                            title="1-year access"
                            originalPrice="$50"
                            price="$25"
                            storage="Join now and get early access to exclusive updates and features."
                            users="Be among the first to experience advanced transcription tools and AI-powered features!"
                            sendUp={true}
                        />
                        <PricingCard
                            title="Lifetime Access"
                            originalPrice="$150"
                            price="$50"
                            storage="Secure lifetime access with exclusive perks and continuous updates."
                            users="Enjoy permanent access to new features, including priority support and more!"
                            sendUp={true}
                        />
                    </div>
                </section>
            </div>
        </VirtualizedWrapper>
    );
};
export default LandingPage;
