import React, { useCallback, useEffect } from "react";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

interface PricingCardProps {
  amount: number;
}

const PricingCard: React.FC<PricingCardProps> = ({ amount }) => {
  const [{ isPending }] = usePayPalScriptReducer();

  const createOrder = useCallback(async () => {
    return window.paypal?.order.create({
      purchase_units: [{ amount: { value: amount.toString() } }],
    });
  }, [amount]);

  const onApprove = useCallback(async (data: any) => {
    console.log("Transaction completed:", data);
  }, []);

  const onCancel = useCallback(() => {
    console.log("Transaction cancelled");
  }, []);

  const onError = useCallback((err: unknown) => {
    console.error("Payment Error:", err);
  }, []);

  useEffect(() => {
    // PayPal script can be loaded or initialized here if needed
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Pricing Plan</h2>
      <p className="text-gray-700 mb-4">${amount}</p>

      {isPending ? (
        <p>Loading PayPal...</p>
      ) : (
        <PayPalButtons createOrder={createOrder} onApprove={onApprove} onCancel={onCancel} onError={onError} />
      )}
    </div>
  );
};

export default PricingCard;
