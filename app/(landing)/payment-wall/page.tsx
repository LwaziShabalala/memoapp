"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PricingCard from "@/components/ui/pricingcard";

const PaymentWall = () => {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Payment successful!");
    router.refresh(); // Refresh the page or user data
  };

  const handleCancel = () => {
    toast.error("Payment cancelled.");
    router.refresh(); // Optional: handle UI rollback
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-4 bg-gray-50 dark:bg-background">
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
          lemonSqueezyVariantId="12345" // ✅ Replace with your actual variant ID
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />

        <PricingCard
          title="Lifetime Access"
          originalPrice="$150"
          price="$50"
          storage="Secure lifetime access with exclusive perks and continuous updates."
          users="Enjoy permanent access to new features, including priority support and more!"
          sendUp={true}
          lemonSqueezyVariantId="67890" // ✅ Replace with your actual variant ID
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default PaymentWall;
