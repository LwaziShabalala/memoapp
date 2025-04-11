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
          storage="Join now and get early access to exclusive updates and features."
          users="Be among the first to experience advanced transcription tools and AI-powered features!"
          sendUp={true}
          checkoutUrl="https://lwazistore.lemonsqueezy.com/buy/fbf50ea6-eed4-4a16-92d4-5bd3bae29162"
        />

        <PricingCard
          title="Lifetime Access"
          originalPrice="$150"
          price="$50"
          storage="Secure lifetime access with exclusive perks and continuous updates."
          users="Enjoy permanent access to new features, including priority support and more!"
          sendUp={true}
          checkoutUrl="https://lwazistore.lemonsqueezy.com/buy/ccfe9bd3-63b3-4c5e-afe8-c53860441e7b"
        />
      </div>
    </div>
  );
};

export default PaymentWall;
