import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  amount: number;
  title?: string;
  description?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  amount, 
  title = "Pricing Plan", 
  description = "Access to all premium features" 
}) => {
  const [isPending, setIsPending] = useState(false);

  // Load PayPal script dynamically
  useEffect(() => {
    if (!document.querySelector('script[src*="paypal.com/sdk"]')) {
      setIsPending(true);
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
      script.async = true;
      script.onload = () => {
        setIsPending(false);
      };
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = useCallback(async () => {
    if (!window.paypal) return;
    
    try {
      setIsPending(true);
      // Implement your payment logic here
      // This would typically be a call to your backend
      // which then creates a PayPal order
      
      // Example mock implementation:
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Payment process would start here!");
      setIsPending(false);
    } catch (error) {
      console.error("Payment Error:", error);
      setIsPending(false);
    }
  }, []);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-3xl font-bold">${amount}</p>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
      </CardContent>
      <CardFooter>
        {isPending ? (
          <Button disabled className="w-full">Loading Payment Options...</Button>
        ) : (
          <Button 
            onClick={handlePayment} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Pay with PayPal
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
