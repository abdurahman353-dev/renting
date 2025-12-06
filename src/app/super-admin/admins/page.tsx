'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Plus, Shield, ShieldAlert, Trash2, Edit } from "lucide-react";

// Mock data type
type Admin = {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Property Manager' | 'Finance Manager';
    status: 'Active' | 'Suspended';
    lastLogin: string;
};

const initialAdmins: Admin[] = [
    { id: '1', name: "Alice Smith", email: "alice@rentsys.com", role: "Admin", status: "Active", lastLogin: "2 hours ago" },
    { id: '2', name: "Bob Jones", email: "bob@rentsys.com", role: "Property Manager", status: "Active", lastLogin: "5 hours ago" },
    { id: '3', name: "Charlie Day", email: "charlie@rentsys.com", role: "Finance Manager", status: "Suspended", lastLogin: "3 days ago" },
];

export default function AdminManagementPage() {
    const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // New Admin Form State
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminRole, setNewAdminRole] = useState('Admin');

    const handleAddAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        const newAdmin: Admin = {
            id: Math.random().toString(36).substr(2, 9),
            name: newAdminName,
            email: newAdminEmail,
            role: newAdminRole as any,
            status: 'Active',
            lastLogin: 'Never',
        };
        setAdmins([...admins, newAdmin]);
        setIsAddDialogOpen(false);
        // Reset form
        setNewAdminName('');
        setNewAdminEmail('');
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this admin?')) {
            setAdmins(admins.filter(a => a.id !== id));
        }
    };

    const handleToggleStatus = (id: string) => {
        setAdmins(admins.map(a => {
            if (a.id === id) {
                return { ...a, status: a.status === 'Active' ? 'Suspended' : 'Active' };
            }
            return a;
        }));
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Management</h2>
                    <p className="text-muted-foreground mt-2">Manage system administrators and their permissions.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Add New Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Admin</DialogTitle>
                            <DialogDescription>
                                Create a new administrator account. They will receive an email to set their password.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddAdmin} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={newAdminName}
                                    onChange={(e) => setNewAdminName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@rentsys.com"
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newAdminRole}
                                    onChange={(e) => setNewAdminRole(e.target.value)}
                                >
                                    <option value="Admin">Full Admin</option>
                                    <option value="Property Manager">Property Manager</option>
                                    <option value="Finance Manager">Finance Manager</option>
                                </select>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Account</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search admins..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 max-w-sm"
                    />
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAdmins.map((admin) => (
                            <TableRow key={admin.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{admin.name}</span>
                                        <span className="text-xs text-muted-foreground">{admin.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-normal">
                                        <Shield className="mr-1 h-3 w-3" />
                                        {admin.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={admin.status === 'Active' ? 'default' : 'destructive'}
                                        className={admin.status === 'Active' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    >
                                        {admin.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{admin.lastLogin}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => alert('Edit functionality to be implemented')}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(admin.id)}>
                                                <ShieldAlert className="mr-2 h-4 w-4" />
                                                {admin.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(admin.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
