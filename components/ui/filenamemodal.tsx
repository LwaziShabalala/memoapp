"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface FilenameModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (filename: string) => void;
}

const FilenameModal = ({ open, onClose, onSave }: FilenameModalProps) => {
    const [filename, setFilename] = useState("");

    const handleSave = () => {
        if (filename.trim() === "") return;
        onSave(filename);
        setFilename("");
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSave();
        }
    };

    if (!open) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center transition-opacity"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-lg shadow-xl p-6 transition-all scale-100 opacity-100 max-w-md mx-4 relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="text-center w-64">
                    <h3 className="text-xl font-semibold text-white mb-4">
                        Name Your Recording
                    </h3>
                    
                    <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 rounded-md mb-6 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        placeholder="Enter file name"
                    />
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="w-full px-4 py-2 rounded-md bg-gray-800 text-zinc-300 hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="w-full px-4 py-2 rounded-md bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilenameModal;
