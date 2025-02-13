"use client"
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { TranscriptionProvider } from "../transcriptioncontext"; // Adjust the import path based on your file structure
import { Toaster, toast } from "@/components/ui/toaster"; // Import Toaster and toast from the new toast component

const DashboardLayout = ({
    children
}: {
    children: React.ReactNode;
}) => {
    // Example of triggering a toast when the layout loads
    React.useEffect(() => {
        toast({
            title: "Welcome to the Dashboard",
            description: "Everything is set up and ready to go!",
        });
    }, []);

    return (
        <TranscriptionProvider>
            <div className="h-full relative">
                {/* Sidebar - only visible on medium and larger screens */}
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                    <Sidebar />
                </div>

                {/* Main content area */}
                <main className="md:pl-72">
                    <Navbar />
                    {children}
                </main>
            </div>

            {/* Add Toaster component here to display toast notifications */}
            <Toaster />
        </TranscriptionProvider>
    );
};

export default DashboardLayout;
