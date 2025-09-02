"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Search, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
    { href: "/", label: "Prospecting & Research", icon: Search },
    { href: "/reply-crafter", label: "Reply Crafter", icon: MessageCircle },
];

const NavContent = () => {
    const pathname = usePathname();
    return (
        <nav className="flex flex-col items-center gap-4 px-2 py-4 sm:items-start">
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
    )
}

export default function Sidebar() {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Sheet>
                <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline" className="sm:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <div className="flex items-center">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                         <h1 className="ml-2 text-lg font-semibold">RSM Insights</h1>
                    </div>
                </header>
                <SheetContent side="left" className="sm:max-w-xs">
                     <NavContent />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <TooltipProvider>
            <aside className="hidden h-screen w-14 flex-col items-center border-r bg-background sm:flex">
                <div className="flex h-14 items-center justify-center border-b">
                    <Link href="/" className="group">
                        <BrainCircuit className="h-7 w-7 text-sidebar-foreground transition-colors group-hover:text-primary" />
                    </Link>
                </div>
                <NavContent />
            </aside>
        </TooltipProvider>
    );
}
