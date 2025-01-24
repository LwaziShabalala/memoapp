"use client";
import React, { useRef } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight, Upload } from "lucide-react";
import FilenameModal from "./ui/filenamemodal";
import { useTranscription } from "../app/transcriptioncontext";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

const UploadButton: React.FC = () => {
    const [showFilenameModal, setShowFilenameModal] = React.useState(false);
    const { setFilename, setTranscription } = useTranscription();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const fileData = await file.arrayBuffer();
                const pdfText = await extractPdfText(fileData);
                setTranscription(pdfText);
                setShowFilenameModal(true);
            } catch (error) {
                console.error("Error extracting text from PDF:", error);
            }
        }
    };

    // Handle filename save
    const handleSave = (filename: string) => {
        setFilename(filename);
        setShowFilenameModal(false);
    };

    // Handle the card click to trigger file input
    const handleCardClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center">
            <Card
                onClick={handleCardClick}
                className="p-6 border-black/5 flex flex-col items-center justify-center hover:shadow-md transition cursor-pointer w-40 h-40"
            >
                <div className="p-4 w-fit h-fit rounded-full bg-violet-500/10">
                    <Upload className="w-10 h-10 text-violet-500" />
                </div>
                <div className="font-semibold mt-4 text-center">Upload PDF</div>
                <ArrowRight className="w-5 h-5 mt-2" />
            </Card>

            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
            />

            <FilenameModal
                open={showFilenameModal}
                onClose={() => setShowFilenameModal(false)}
                onSave={handleSave}
            />
        </div>
    );
};

// Helper function to extract text from a PDF
const extractPdfText = async (fileData: ArrayBuffer): Promise<string> => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
    let extractedText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Safely map textContent items
        extractedText += textContent.items
            .map((item) => {
                if ("str" in item) {
                    return (item as { str: string }).str; // Type assertion for 'str'
                }
                return ""; // Ignore non-TextItem items
            })
            .join(" ");
    }

    return extractedText;
};

export default UploadButton;
