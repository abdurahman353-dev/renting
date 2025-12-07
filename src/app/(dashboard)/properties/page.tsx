"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MapPin, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatTextType } from "@/lib/utils"

// Mock data for display purposes
const properties = [
    {
        id: 1,
        name: "Sunrise_apartments",
        location: "Westlands, Nairobi",
        units: 12,
        occupied: 10,
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXBhcnRtZW50fGVufDB8fDB8fHww",
    },
    {
        id: 2,
        name: "Green_valley_estate",
        location: "Kileleshwa, Nairobi",
        units: 8,
        occupied: 8,
        image: "https://images.unsplash.com/photo-1512918760532-3ed868d89343?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGhvdXNlfGVufDB8fDB8fHww",
    },
    {
        id: 3,
        name: "Ocean_view_residency",
        location: "Nyali, Mombasa",
        units: 24,
        occupied: 15,
        image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXBhcnRtZW50fGVufDB8fDB8fHww",
    },
]

export default function PropertiesPage() {
    const router = useRouter()

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
                    <p className="text-muted-foreground">Manage your houses and residential units.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Property
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search properties..."
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                    <Card
                        key={property.id}
                        onClick={() => router.push(`/properties/${property.name}`)}
                        className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer border-slate-200"
                    >
                        <div className="h-48 overflow-hidden relative">
                            <img
                                src={property.image}
                                alt={property.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-2 right-2">
                                <Badge variant={property.occupied === property.units ? "secondary" : "default"} className="bg-white/90 text-black hover:bg-white">
                                    {property.occupied}/{property.units} Occupied
                                </Badge>
                            </div>
                        </div>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span>{formatTextType(property.name)}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4 text-indigo-500" />
                                    {property.location}
                                </div>
                                <div className="flex items-center">
                                    <Home className="mr-2 h-4 w-4 text-indigo-500" />
                                    {property.units} Units Total
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <div className="text-xs font-medium text-slate-500">
                                    Occupancy Rate
                                </div>
                                <div className="text-sm font-bold text-indigo-600">
                                    {Math.round((property.occupied / property.units) * 100)}%
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
