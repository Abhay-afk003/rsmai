"use client";

import { useState } from "react";
import Link from "next/link";
import { BrainCircuit, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NavContent } from "@/components/sidebar";

export default function MobileHeader() {
    const isMobile = useIsMobile();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    if (!isMobile) {
        return null;
    }

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    <SheetHeader className="text-left">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    </SheetHeader>
                    <nav className="grid gap-2 text-lg font-medium">
                        <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setIsSheetOpen(false)}>
                            <BrainCircuit className="h-6 w-6 text-primary" />
                            <span>RSM Insights</span>
                        </Link>
                        <NavContent onLinkClick={() => setIsSheetOpen(false)} />
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="flex-1 text-center">
                 <Link href="/" className="flex items-center gap-2 font-semibold text-lg justify-center">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <h1>RSM Insights</h1>
                </Link>
            </div>
        </header>
    );
}