"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreVertical, Phone, Mail } from "lucide-react"

const tenants = [
    {
        id: "T001",
        name: "John Kamau",
        unit: "A-101",
        property: "Sunrise Apartments",
        phone: "+254 712 345 678",
        status: "Active",
        balance: 0,
    },
    {
        id: "T002",
        name: "Sarah Ochieng",
        unit: "B-205",
        property: "Green Valley Estate",
        phone: "+254 722 987 654",
        status: "Active",
        balance: -15000, // Arrears
    },
    {
        id: "T003",
        name: "Michael Rotich",
        unit: "C-003",
        property: "Ocean View Residency",
        phone: "+254 733 111 222",
        status: "Notice",
        balance: 5000, // Credit
    },
]

export default function TenantsPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
                    <p className="text-muted-foreground">Manage tenant profiles and lease agreements.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Register Tenant
                </Button>
            </div>

            <div className="flex items-center justify-between space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name, ID, or unit..."
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Property / Unit</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Balance (KES)</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.map((tenant) => (
                            <TableRow key={tenant.id} className="cursor-pointer hover:bg-slate-50">
                                <TableCell className="font-medium">
                                    <div>{tenant.name}</div>
                                    <div className="text-xs text-muted-foreground">{tenant.id}</div>
                                </TableCell>
                                <TableCell>
                                    <div>{tenant.property}</div>
                                    <div className="text-xs text-muted-foreground">{tenant.unit}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Phone className="mr-2 h-3 w-3" /> {tenant.phone}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={tenant.status === "Active" ? "default" : "destructive"}
                                        className={
                                            tenant.status === "Active" ? "bg-emerald-500 hover:bg-emerald-600" :
                                                tenant.status === "Notice" ? "bg-orange-500 hover:bg-orange-600" : ""
                                        }
                                    >
                                        {tenant.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${tenant.balance < 0 ? "text-red-600" :
                                        tenant.balance > 0 ? "text-green-600" : ""
                                    }`}>
                                    {tenant.balance === 0 ? "Cleared" :
                                        tenant.balance > 0 ? `+${tenant.balance.toLocaleString()}` :
                                            tenant.balance.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
