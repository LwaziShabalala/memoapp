"use client";
import { useUser } from "@clerk/nextjs";
import { LandingHero } from "@/components/landing-hero";
import LandingNavbar from "@/components/landing-navbar";
import PricingCard from "@/components/ui/pricingcard";
import VideoComponent from "@/components/landing-video";
import FeaturesSection from "@/components/landing-features";
import VirtualizedWrapper from "@/components/virtualized-wrapper";

const LandingPage = () => {
  useUser();
  
  return (
    <VirtualizedWrapper>
      <div className="min-h-screen bg-gray-950">
        <LandingNavbar />
        <section className="py-16">
          <LandingHero />
        </section>
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
              checkoutUrl="https://memoapp.lemonsqueezy.com/buy/816dd08c-0bca-4533-9d49-4f9a80793135?embed=1"
            />
            <PricingCard
              title="Lifetime Access"
              originalPrice="$150"
              price="$50"
              storage="Secure lifetime access with exclusive perks and continuous updates."
              users="Enjoy permanent access to new features, including priority support and more!"
              sendUp={true}
              checkoutUrl="YOUR_LIFETIME_CHECKOUT_URL" // Replace with your lifetime subscription URL
            />
          </div>
        </section>
      </div>
    </VirtualizedWrapper>
  );
};
export default LandingPage;
