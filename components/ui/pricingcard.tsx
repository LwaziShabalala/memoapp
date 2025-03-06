"use client";

import React, { useCallback, useState } from "react";
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
  // Payment callbacks
  onSuccess?: (reference: string) => void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
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
  sendUp,
  // Callback handlers
  onSuccess,
  onCancel,
  onError
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
      script.onerror = (err) => {
        setIsPending(false);
        if (onError) onError(err);
      };
      document.body.appendChild(script);
    }
  }, [onError]);

  const handlePayment = useCallback(async () => {
    // Only load PayPal when user clicks payment button
    loadPayPalScript();
    
    try {
      setIsPending(true);
      
      // Mock successful payment for demo purposes
      // In a real implementation, this would be your PayPal order creation and processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a mock reference number
      const reference = `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(reference);
      } else {
        alert(`Payment successful! Reference: ${reference}`);
      }
      
      setIsPending(false);
    } catch (error) {
      setIsPending(false);
      if (onError) {
        onError(error);
      } else {
        console.error("Payment Error:", error);
      }
    }
  }, [loadPayPalScript, onSuccess, onError]);

  const handleCancel = useCallback(() => {
    setIsPending(false);
    if (onCancel) {
      onCancel();
    } else {
      alert("Payment cancelled");
    }
  }, [onCancel]);

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
      <CardFooter className="flex flex-col gap-2">
        {isPending ? (
          <Button disabled className="w-full">Processing...</Button>
        ) : (
          <>
            <Button 
              onClick={handlePayment} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </Button>
            {onCancel && (
              <Button 
                onClick={handleCancel}
                variant="outline" 
                className="w-full text-gray-400"
              >
                Cancel
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
