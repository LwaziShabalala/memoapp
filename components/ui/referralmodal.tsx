"use client";
import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

interface ReferralModalProps {
  onSubmit: (referrerName: string) => void;
}

const ReferralModal = ({ onSubmit }: ReferralModalProps) => {
  const [influencer, setInfluencer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Disable scrolling while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSubmit = async () => {
    if (!influencer.trim()) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Send the referral data via EmailJS
      await emailjs.send(
        "service_9cx86v8",
        "template_y9rqnlk",
        {
          influencer_name: influencer,
          timestamp: new Date().toString()
        },
        "OZmeuEFrsHTm_D2yQ"
      );
      
      // Call the onSubmit function to close the modal
      onSubmit(influencer);
    } catch (err) {
      console.error("Failed to send email:", err);
      setError("Failed to submit. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg shadow-xl p-6 max-w-md mx-4 relative">
        <div className="text-center w-full">
          <h3 className="text-xl font-semibold text-white mb-6">
            Who referred you to us?
          </h3>
          <p className="text-zinc-400 mb-6 text-sm">
            If an influencer or content creator brought you here, please let us know who they are!
          </p>
          
          <input
            type="text"
            value={influencer}
            onChange={(e) => setInfluencer(e.target.value)}
            className="w-full p-3 rounded-md mb-6 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            placeholder="Influencer or referrer name"
            autoFocus
          />
          
          {error && (
            <p className="text-red-500 mb-4 text-sm">{error}</p>
          )}
          
          <button 
            onClick={handleSubmit}
            disabled={!influencer.trim() || isSubmitting}
            className={`w-full px-4 py-3 rounded-md bg-violet-500 text-white transition-colors ${
              (!influencer.trim() || isSubmitting) 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-violet-600"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Continue"}
          </button>
          
          <p className="text-zinc-500 mt-4 text-xs">
  Not referred by anyone? You can just submit &quot;None&quot;.
</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
