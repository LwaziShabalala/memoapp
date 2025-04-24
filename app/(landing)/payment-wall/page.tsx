"use client";
import React from "react";
import PricingCard from "@/components/ui/pricingcard";

const PaymentWall = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-4 bg-gray-950 dark:bg-background">
      <h1 className="text-4xl font-bold text-center mb-10 text-primary">
        Choose Your Plan
      </h1>
      <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-3 max-w-6xl w-full">
        <PricingCard
          title="Starter"
          price="$5"
          features={[
            { text: "Transcribe lecture audio to text", included: true },
            { text: "Summarize long lectures automatically", included: true },
            { text: "Create flashcards from notes", included: true },
            { text: "Export notes as PDF", included: true },
            { text: "Chat with your lecture notes", included: false },
            { text: "Early beta access", included: false },
            { text: "Priority transcription processing", included: false },
            { text: "Future AI model upgrades", included: false },
            { text: "Lifetime updates", included: false },
            { text: "Exclusive access to premium UI features", included: false },
          ]}
          checkoutUrl="https://thememoapp.lemonsqueezy.com/buy/c744bf3e-8961-44b2-a980-7c1011006e55"
        />
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
          checkoutUrl="https://thememoapp.lemonsqueezy.com/buy/ba96f43a-e5cb-4f0a-a7a0-64ce78a11a12"
          highlighted={true}
        />
      </div>
    </div>
  );
};

export default PaymentWall;
