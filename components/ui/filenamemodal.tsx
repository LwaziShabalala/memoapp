"use client";
import { useState } from "react";
import { X } from "react-feather";

interface FilenameModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (filename: string) => void;
}

const FilenameModal = ({ open, onClose, onSave }: FilenameModalProps) => {
    const [filename, setFilename] = useState("");

    const handleSave = () => {
        if (filename.trim() === "") return; // Prevent saving empty filenames
        onSave(filename);
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
            className="fixed inset-0 flex justify-center items-center transition-colors visible bg-black/20"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow p-6 transition-all scale-100 opacity-100"
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 rounded-lg text-gray-400 bg-white hover:bg-gray-50 hover:text-gray-600"
                >
                    <X />
                </button>
                <div className="text-center w-64">
                    <h3 className="text-lg font-black text-gray-800 mb-4">Name Your File</h3>
                    <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        onKeyDown={handleKeyDown} // Listen for "Enter" key
                        className="w-full p-2 border rounded-md mb-4"
                        placeholder="Enter file name"
                    />
                    <div className="flex gap-4">
                        <button className="btn btn-light w-full" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="btn btn-primary w-full" onClick={handleSave}>
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilenameModal;
