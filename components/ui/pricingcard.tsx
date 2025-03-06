"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  amount?: number;
  title?: string;
  description?: string;
  // Additional properties from landing page
  originalPrice?: string;
  price?: string;
  storage?: string;
  users?: string;
  sendUp?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  amount,
  title = "Pricing Plan", 
  description,
  // Handle additional properties
  originalPrice,
  price,
  storage,
  users,
  sendUp
}) => {
  const [isPending, setIsPending] = useState(false);
  
  // Display price from either amount or price prop
  const displayPrice = price || (amount ? `$${amount}` : null);

  // Load PayPal script dynamically - only when needed for payment
  const loadPayPalScript = useCallback(() => {
    if (!document.querySelector('script[src*="paypal.com/sdk"]')) {
      setIsPending(true);
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test'}&currency=USD`;
      script.async = true;
      script.onload = () => {
        setIsPending(false);
      };
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = useCallback(async () => {
    // Only load PayPal when user clicks payment button
    loadPayPalScript();
    
    try {
      setIsPending(true);
      // Implement your payment logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Payment process would start here!");
      setIsPending(false);
    } catch (error) {
      console.error("Payment Error:", error);
      setIsPending(false);
    }
  }, [loadPayPalScript]);

  return (
    <Card className={`w-full max-w-sm ${sendUp ? "-mt-8" : ""}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          {originalPrice && (
            <p className="text-sm line-through text-gray-400">{originalPrice}</p>
          )}
          <p className="text-3xl font-bold">{displayPrice}</p>
          
          {description && (
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          )}
          
          {storage && (
            <div className="mt-4 text-sm">
              <p>{storage}</p>
            </div>
          )}
          
          {users && (
            <div className="mt-2 text-sm">
              <p>{users}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isPending ? (
          <Button disabled className="w-full">Processing...</Button>
        ) : (
          <Button 
            onClick={handlePayment} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Get Started
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
