"use client";
import { useState, useEffect } from "react";

interface ReferralModalProps {
  onSubmit: (referrerName: string) => void;
}

const ReferralModal = ({ onSubmit }: ReferralModalProps) => {
  const [referrer, setReferrer] = useState("");
  const [options] = useState([
    "Friend/Family",
    "Social Media",
    "Google",
    "YouTube",
    "Other"
  ]);
  const [customOption, setCustomOption] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  const handleSubmit = () => {
    if (selectedOption === "Other" && customOption.trim() !== "") {
      onSubmit(customOption);
    } else if (selectedOption) {
      onSubmit(selectedOption);
    }
  };

  useEffect(() => {
    // Disable scrolling while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg shadow-xl p-6 max-w-md mx-4 relative">
        <div className="text-center w-full">
          <h3 className="text-xl font-semibold text-white mb-6">
            Who referred you to us?
          </h3>
          <p className="text-zinc-400 mb-6 text-sm">
            We'd love to know how you found out about our service!
          </p>
          
          <div className="space-y-3 mb-6">
            {options.map((option) => (
              <div 
                key={option}
                onClick={() => setSelectedOption(option)}
                className={`p-3 rounded-md cursor-pointer transition-all ${
                  selectedOption === option 
                    ? "bg-violet-500 text-white" 
                    : "bg-gray-800 text-zinc-300 hover:bg-gray-700"
                }`}
              >
                {option}
              </div>
            ))}
          </div>
          
          {selectedOption === "Other" && (
            <input
              type="text"
              value={customOption}
              onChange={(e) => setCustomOption(e.target.value)}
              className="w-full p-3 rounded-md mb-6 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="Please specify"
              autoFocus
            />
          )}
          
          <button 
            onClick={handleSubmit}
            disabled={!selectedOption || (selectedOption === "Other" && !customOption.trim())}
            className={`w-full px-4 py-3 rounded-md bg-violet-500 text-white transition-colors ${
              (!selectedOption || (selectedOption === "Other" && !customOption.trim())) 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-violet-600"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
