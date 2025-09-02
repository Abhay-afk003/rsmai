"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Search, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
    { href: "/", label: "Client Analysis", icon: Search },
    { href: "/reply-crafter", label: "Reply Crafter", icon: MessageCircle },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <TooltipProvider>
            <aside className="flex h-screen w-14 flex-col items-center border-r bg-sidebar sm:w-16">
                <div className="flex h-16 items-center justify-center border-b">
                    <Link href="/" className="group">
                        <BrainCircuit className="h-7 w-7 text-sidebar-foreground transition-colors group-hover:text-primary" />
                    </Link>
                </div>
                <nav className="flex flex-col items-center gap-4 py-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                            isActive && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="sr-only">{item.label}</span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>
            </aside>
        </TooltipProvider>
    );
}
