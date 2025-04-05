"use client";
import { useUser } from "@clerk/nextjs";
import LandingNavbar from "@/components/landing-navbar";
import PricingCard from "@/components/ui/pricingcard";
import VirtualizedWrapper from "@/components/virtualized-wrapper";
import { useRouter } from "next/navigation";

const PaymentWall = () => {
  const { isLoaded } = useUser();
  const router = useRouter();

  const handleSuccess = (paymentId: string) => {
    console.log("Payment successful, reference:", paymentId);
    router.push("/sign-up");
  };

  const handleCancel = () => {
    console.log("Payment was canceled");
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <VirtualizedWrapper>
      <div className="min-h-screen bg-gray-950">
        <LandingNavbar />
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
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </section>
      </div>
    </VirtualizedWrapper>
  );
};

export default PaymentWall;
