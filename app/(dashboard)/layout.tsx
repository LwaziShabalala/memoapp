"use client"
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { TranscriptionProvider } from "../transcriptioncontext"; 
import { Toaster } from "@/components/ui/toaster"; // Correct import
import { useToast } from "@/components/ui/use-toast"; // Correct toast import
import { useEffect } from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast(); // Access toast function

    useEffect(() => {
        toast({
            title: "Welcome to the Dashboard",
            description: "Everything is set up and ready to go!",
        });
    }, []);

    return (
        <TranscriptionProvider>
            <div className="h-full relative">
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                    <Sidebar />
                </div>
                <main className="md:pl-72">
                    <Navbar />
                    {children}
                </main>
            </div>

            {/* Ensure Toaster is present */}
            <Toaster />
        </TranscriptionProvider>
    );
};

export default DashboardLayout;
