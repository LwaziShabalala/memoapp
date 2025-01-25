"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

interface Lecture {
    id: string;
    name: string;
    transcription: string;
}

interface TranscriptionContextType {
    filename: string | null;
    transcription: string | null;
    setFilename: (filename: string) => void;
    setTranscription: (transcription: string) => void;
    clearTranscription: () => void;
    saveLecture: () => void;  // New function to explicitly save lectures
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

export const TranscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [filename, setFilenameState] = useState<string | null>(null);
    const [transcription, setTranscriptionState] = useState<string | null>(null);

    // Function to save lectures to local storage
    const saveLecture = useCallback(() => {
        if (filename && transcription) {
            const lectures: Lecture[] = JSON.parse(localStorage.getItem('lectures') || '[]');
            const newLecture: Lecture = {
                id: String(Date.now()),
                name: filename,
                transcription: transcription
            };

            // Check for duplicates
            const isDuplicate = lectures.some(lecture =>
                lecture.name === filename &&
                lecture.transcription === transcription
            );

            if (!isDuplicate) {
                lectures.push(newLecture);
                localStorage.setItem('lectures', JSON.stringify(lectures));
            }
        }
    }, [filename, transcription]);

    const clearTranscription = useCallback(() => {
        setFilenameState(null);
        setTranscriptionState(null);
    }, []);

    // Simple setters that don't automatically save
    const setFilename = useCallback((name: string) => {
        setFilenameState(name);
    }, []);

    const setTranscription = useCallback((text: string) => {
        setTranscriptionState(text);
    }, []);

    return (
        <TranscriptionContext.Provider
            value={{
                filename,
                transcription,
                setFilename,
                setTranscription,
                clearTranscription,
                saveLecture
            }}
        >
            {children}
        </TranscriptionContext.Provider>
    );
};

export const useTranscription = () => {
    const context = useContext(TranscriptionContext);
    if (!context) {
        throw new Error('useTranscription must be used within a TranscriptionProvider');
    }
    return context;
};