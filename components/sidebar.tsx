"use client";

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Home } from "lucide-react";




const montserrat = Montserrat({
    weight: "600",
    subsets: ["latin"],
});

const routes = [
    {
        label: "Dashboard",
        icon: Home,
        href: "/dashboard",
        color: "purple",
    },
    {
        label: "My Lectures",
        icon: BookOpen,
        href: "/Mylectures",
        color: "purple",
    },
];

const Sidebar = () => {
    const pathname = usePathname() || "/";

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-black text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        <Image fill alt="Icon" src="/icon.png" priority />
                    </div>
                    <h1 className={cn("text-2xl font-bold", montserrat.className)}>Memo</h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            href={route.href}
                            key={route.href}
                            className={cn(
                                "text-sm group flex items-center p-3 w-full justify-start font-medium cursor-pointer rounded-lg transition hover:text-white hover:bg-white/20",
                                pathname === route.href
                                    ? "text-white font-bold bg-white/10"
                                    : "text-zinc-400"
                            )}
                            aria-current={pathname === route.href ? "page" : undefined}
                        >
                            <route.icon
                                className={cn(
                                    "h-5 w-5 mr-3",
                                    pathname === route.href
                                        ? `text-${route.color}-500`
                                        : "text-zinc-400 group-hover:text-white"
                                )}
                            />
                            <span>{route.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
