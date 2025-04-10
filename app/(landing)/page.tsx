"use client";

import { useUser } from "@clerk/nextjs";
import { LandingHero } from "@/components/landing-hero";
import LandingNavbar from "@/components/landing-navbar";
import PricingCard from "@/components/ui/pricingcard";
import VideoComponent from "@/components/landing-video";
import FeaturesSection from "@/components/landing-features";
import VirtualizedWrapper from "@/components/virtualized-wrapper";

const LandingPage = () => {
  const { user } = useUser();

  return (
    <VirtualizedWrapper>
      <div className="min-h-screen bg-gray-950">
        <LandingNavbar />
        <section className="py-12">
          <LandingHero />
        </section>

        {/* Video Section */}
        <section className="w-full bg-gray-950 px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-200 mb-4 text-center">
              See how it works
            </h2>
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
              originalPrice="$150"
              price="$99"
              storage="Join now and get early access to exclusive updates and features."
              users="Be among the first to experience advanced transcription tools and AI-powered features!"
              sendUp={true}
              checkoutUrl="https://lwazistore.lemonsqueezy.com/buy/fbf50ea6-eed4-4a16-92d4-5bd3bae29162"
            />
            <PricingCard
              title="Lifetime Access"
              originalPrice="$199"
              price="$149"
              storage="Secure lifetime access with exclusive perks and continuous updates."
              users="Enjoy permanent access to new features, including priority support and more!"
              sendUp={true}
              checkoutUrl="https://lwazistore.lemonsqueezy.com/buy/ccfe9bd3-63b3-4c5e-afe8-c53860441e7b"
            />
          </div>
        </section>
      </div>
    </VirtualizedWrapper>
  );
};

export default LandingPage;
