'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
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

type Admin = {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Suspended';
    last_login_at?: string;
};

export default function AdminManagementPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // New Admin Form State
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminRole, setNewAdminRole] = useState('Admin');
    const [newAdminPassword, setNewAdminPassword] = useState('');

    const fetchAdmins = async () => {
        try {
            const response = await api.get('/super-admin/admins');
            setAdmins(response.data);
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/super-admin/admins', {
                name: newAdminName,
                email: newAdminEmail,
                role: newAdminRole,
                password: newAdminPassword
            });
            fetchAdmins();
            setIsAddDialogOpen(false);
            setNewAdminName('');
            setNewAdminEmail('');
            setNewAdminPassword('');
        } catch (error) {
            alert('Failed to create admin');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this admin?')) {
            try {
                await api.delete(`/super-admin/admins/${id}`);
                setAdmins(admins.filter(a => a.id !== id));
            } catch (error) {
                alert('Failed to delete admin');
            }
        }
    };

    const handleToggleStatus = async (admin: Admin) => {
        const action = admin.status === 'Active' ? 'suspend' : 'activate';
        try {
            await api.post(`/super-admin/admins/${admin.id}/${action}`);
            fetchAdmins();
        } catch (error) {
            alert(`Failed to ${action} admin`);
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8">Loading admins...</div>;

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
                                Create a new administrator account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddAdmin} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
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
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newAdminPassword}
                                    onChange={(e) => setNewAdminPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                        {filteredAdmins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No admins found
                                </TableCell>
                            </TableRow>
                        ) : filteredAdmins.map((admin) => (
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
                                <TableCell className="text-muted-foreground">
                                    {admin.last_login_at || 'Never'}
                                </TableCell>
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
                                            <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
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
