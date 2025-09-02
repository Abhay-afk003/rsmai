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

const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const pathname = usePathname();

    if (isMobile) {
        return (
            <nav className="grid gap-2 text-lg font-medium">
                <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <span>RSM Insights</span>
                </Link>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                isActive && "text-primary bg-muted"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        )
    }
    
    return (
        <TooltipProvider>
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
        </TooltipProvider>
    )
}

export default function Sidebar() {
    const isMobile = useIsMobile();
    
    if (isMobile) {
        return (
             <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                        >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col">
                        <NavContent isMobile={true} />
                    </SheetContent>
                </Sheet>
                 <div className="flex items-center">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <h1 className="ml-2 text-lg font-semibold">RSM Insights</h1>
                </div>
            </header>
        )
    }

    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
            <Link href="/" className="flex h-14 items-center justify-center border-b">
                <BrainCircuit className="h-7 w-7 text-sidebar-foreground transition-colors group-hover:text-primary" />
                <span className="sr-only">RSM Insights AI</span>
            </Link>
            <NavContent />
        </aside>
    );
}