"use client";
import React from "react";
import PricingCard from "@/components/ui/pricingcard";

const PaymentWall = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-4 bg-gray-950 dark:bg-background">
      <h1 className="text-4xl font-bold text-center mb-10 text-primary">
        Choose Your Plan
      </h1>
      <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2 max-w-5xl w-full">
        <PricingCard
              title="1-year access"
              originalPrice="$150"
              price="$99"
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
              checkoutUrl="https://lwazistore.lemonsqueezy.com/buy/fbf50ea6-eed4-4a16-92d4-5bd3bae29162"
            />
        <PricingCard
          title="Lifetime Access"
          originalPrice="150"
          price="50"
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
          checkoutUrl="https://lwazistore.lemonsqueezy.com/buy/7e4155fe-d4c1-4d02-8fc2-f951fada69b2"
          highlighted={true}
        />
      </div>
    </div>
  );
};

export default PaymentWall;
