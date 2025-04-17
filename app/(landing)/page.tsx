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
              originalPrice="$100"
              price="$45"
              features={[
                { text: "Transcribe lecture audio to text", included: true },
  { text: "Summarize long lectures automatically", included: true },
  { text: "Create flashcards from notes", included: true },
  { text: "Export notes as PDF", included: true },
  { text: "Chat with your lecture notes", included: true },
  { text: "Access to all current features", included: true },
  { text: "Early beta access", included: true },
  { text: "Priority transcription processing", included: false },
  { text: "Future AI model upgrades", included: false },
  { text: "Lifetime updates", included: false },
  { text: "Exclusive access to premium UI features", included: false },
              ]}
              checkoutUrl="https://thememoapp.lemonsqueezy.com/buy/ad196543-714d-4cc5-8506-fe9521c56e9c"
            />
            <PricingCard
              title="Lifetime Access"
              originalPrice="$199"
              price="$100"
              features={[
                { text: "Transcribe lecture audio to text", included: true },
  { text: "Summarize long lectures automatically", included: true },
  { text: "Create flashcards from notes", included: true },
  { text: "Export notes as PDF", included: true },
  { text: "Chat with your lecture notes", included: true },
  { text: "Access to all current features", included: true },
  { text: "Early beta access", included: true },
  { text: "Priority transcription processing", included: true },
  { text: "Future AI model upgrades", included: true },
  { text: "Lifetime updates", included: true },
  { text: "Exclusive access to premium UI features", included: true },
              ]}
              updatedText="Updated 2 months ago"
              checkoutUrl="https://thememoapp.lemonsqueezy.com/buy/7e4155fe-d4c1-4d02-8fc2-f951fada69b2"
              highlighted={true}
            />
          </div>
        </section>
      </div>
    </VirtualizedWrapper>
  );
};

export default LandingPage;
