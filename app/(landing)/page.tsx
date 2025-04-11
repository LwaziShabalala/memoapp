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
              features={[
                { text: "NextJS boilerplate", included: true },
                { text: "SEO & Blog", included: true },
                { text: "Mailgun emails", included: true },
                { text: "Stripe / Lemon Squeezy", included: true },
                { text: "MongoDB / Supabase", included: true },
                { text: "Google Oauth & Magic Links", included: true },
                { text: "Components & animations", included: true },
                { text: "ChatGPT prompts for terms & privacy", included: true },
                { text: "Discord community & Leaderboard", included: false },
                { text: "$1,210 worth of discounts", included: false },
                { text: "Lifetime updates", included: false },
              ]}
              checkoutUrl="https://lwazistore.lemonsqueezy.com/buy/fbf50ea6-eed4-4a16-92d4-5bd3bae29162"
            />
            <PricingCard
              title="Lifetime Access"
              originalPrice="$199"
              price="$149"
              features={[
                { text: "NextJS boilerplate", included: true },
                { text: "SEO & Blog", included: true },
                { text: "Mailgun emails", included: true },
                { text: "Stripe / Lemon Squeezy", included: true },
                { text: "MongoDB / Supabase", included: true },
                { text: "Google Oauth & Magic Links", included: true },
                { text: "Components & animations", included: true },
                { text: "ChatGPT prompts for terms & privacy", included: true },
                { text: "Discord community & Leaderboard", included: true },
                { text: "$1,210 worth of discounts", included: true },
                { text: "Lifetime updates", included: true },
              ]}
              updatedText="Updated 2 months ago"
              checkoutUrl="https://lwazistore.lemonsqueezy.com/buy/ccfe9bd3-63b3-4c5e-afe8-c53860441e7b"
              highlighted={true}
            />
          </div>
        </section>
      </div>
    </VirtualizedWrapper>
  );
};

export default LandingPage;
