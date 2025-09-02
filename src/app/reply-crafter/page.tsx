"use client";

import ReplyCrafter from "@/components/reply-crafter";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ReplyCrafterPage() {
    const isMobile = useIsMobile();
    return (
        <div className={isMobile ? "" : "border-t"}>
            <ReplyCrafter />
        </div>
    )
}
