"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

export function DynamicBreadcrumb() {
    const pathname = usePathname()

    // Split the pathname into segments
    const segments = pathname.split("/").filter(Boolean)

    // If we're on the home page, just show "Dashboard"
    if (segments.length === 0) {
        return (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            Dashboard
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        )
    }

    // Helper function to capitalize and format segment names
    const formatSegment = (segment: string) => {
        return segment
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {/* Home/Dashboard link */}
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/" className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            Dashboard
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

                {/* Dynamic segments */}
                {segments.map((segment, index) => {
                    const href = "/" + segments.slice(0, index + 1).join("/")
                    const isLast = index === segments.length - 1

                    return (
                        <div key={href} className="flex items-center gap-1.5">
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href}>{formatSegment(segment)}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </div>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
