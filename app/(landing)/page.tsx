import { LandingHero } from "@/components/landing-hero";
import LandingNavbar from "@/components/landing-navbar";
import PricingCard from "@/components/ui/pricingcard";
import VideoComponent from "@/components/landing-video";
import FeaturesSection from "@/components/landing-features";

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gray-950">
            <LandingNavbar />

            {/* Hero Section */}
            <section className="py-16">
                <LandingHero />
            </section>

            {/* Video Section */}
            <section className="-mt-8 w-full py-12">
                <h2 className="text-2xl font-bold text-gray-200 mb-8 text-center">
                    See how it works
                </h2>
                <div className="max-w-4xl mx-auto px-8">
                    <VideoComponent />
                </div>
            </section>

            <FeaturesSection />

            {/* Pricing Section */}
            <section className="max-w-4xl mx-auto px-4 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <PricingCard
                        title="1-year access"
                        originalPrice="R500"
                        price="R250"
                        storage="Join now and get early access to exclusive updates and features."
                        users="Be among the first to experience advanced transcription tools and AI-powered features!"
                        sendUp={true}
                    />
                    <PricingCard
                        title="Lifetime Access"
                        originalPrice="R1000"
                        price="R500"
                        storage="Secure lifetime access with exclusive perks and continuous updates."
                        users="Enjoy permanent access to new features, including priority support and more!"
                        sendUp={true}
                    />

                </div>
            </section>
        </div>
    );
};

export default LandingPage;
