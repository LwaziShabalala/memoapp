"use client"

import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const Font = Montserrat({
    weight: "600",
    subsets: ["latin"]
});

const LandingNavbar = () => {
    return (
        <nav className="p-4 bg-transparent flex items-center justify-between">
            <Link href="/" className="flex items-center">
                <div className="relative h-8 w-8 mr-4">
                    <Image
                        fill
                        alt="icon"
                        src="/icon.png"
                    />
                </div>
                <h1 className={cn("text-2xl font bold text-white", Font.className)}>
                    memo
                </h1>
            </Link>
            <div className="flex items-center gap-x-2">
                <Link href="/sign-in">
                    <Button variant="outline" className="rounded-full">
                        Sign in
                    </Button>
                </Link>

            </div>
        </nav>
    );
}

export default LandingNavbar;