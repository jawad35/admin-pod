// pages/users.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import {
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Building,
    User,
    RefreshCw,
    Download,
    UserPlus,
    Shield,
    Phone,
    Mail,
    MapPin
} from "lucide-react";
import { useLocation } from "wouter";

const ITEMS_PER_PAGE = 50;

export default function UsersManagement() {
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [shopFilter, setShopFilter] = useState("all");
    const [, setLocation] = useLocation();
    // Fetch users
    const { data: users = [], isLoading, refetch } = useQuery({
        queryKey: ["/api/users"],
    });

    // Fetch shops for filter
    const { data: shops = [] } = useQuery({
        queryKey: ["/api/shops"],
    });

    // Deactivate user mutation
    const deactivateUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            return await apiRequest("PUT", `/api/users/${userId}`, { isActive: false });
        },
        onSuccess: () => {
            toast({ title: "✅ Success", description: "User deactivated successfully" });
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: "❌ Error", description: error.message, variant: "destructive" });
        },
    });

    // Filter users
    const filteredUsers = useMemo(() => {
        return users.filter((user: any) => {
            const matchesSearch =
                user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.mobileNo?.includes(searchTerm);

            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "active" ? user.isActive : !user.isActive);
            const matchesShop = shopFilter === "all" || user.shopId === shopFilter;

            return matchesSearch && matchesRole && matchesStatus && matchesShop;
        });
    }, [users, searchTerm, roleFilter, statusFilter, shopFilter]);

    // Paginate users
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    // Role badge variants
    const getRoleVariant = (role: string) => {
        switch (role) {
            case "super_admin": return "destructive";
            case "admin": return "default";
            case "cashier": return "secondary";
            default: return "outline";
        }
    };

    // Status badge
    const getStatusBadge = (user: any) => {
        return user.isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
                Active
            </Badge>
        ) : (
            <Badge variant="outline" className="text-gray-500">
                Inactive
            </Badge>
        );
    };

    const handleDeactivateUser = (userId: string, userName: string) => {
        if (confirm(`Are you sure you want to deactivate ${userName}?`)) {
            deactivateUserMutation.mutate(userId);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
                            <p className="text-gray-600 mt-2">
                                Manage all users, their roles, and shop assignments
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                            <Button
                                onClick={() => refetch()}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>

                            <Button
                                className="flex items-center gap-2"
                                onClick={() => setLocation("/create-shop-user")}
                            >
                                <UserPlus className="h-4 w-4" />
                                New User
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <Card>
                        <CardContent className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Search */}
                                <div className="lg:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Role Filter */}
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="cashier">Cashier</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Status Filter */}
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Shop Filter */}
                                <Select value={shopFilter} onValueChange={setShopFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Shops" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Shops</SelectItem>
                                        {shops?.map((shop: any) => (
                                            <SelectItem key={shop.id} value={shop.id}>
                                                {shop.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Users ({filteredUsers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Shop
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedUsers.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-medium text-sm">
                                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.firstName} {user.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <Badge variant={getRoleVariant(user.role)} className="flex items-center gap-1 w-fit">
                                                    <Shield className="h-3 w-3" />
                                                    {user.role.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.shopId ? (
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-4 w-4 text-gray-400" />
                                                        {shops?.find((s: any) => s.id === user.shopId)?.name || 'Unknown Shop'}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No shop</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    {user.mobileNo || 'N/A'}
                                                </div>
                                                {user.address && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span className="text-xs truncate max-w-32">{user.address}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {getStatusBadge(user)}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem className="flex items-center gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setLocation(`/shop-subscriptions/${user.shopId}`)}
                                                            className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            Subscription History
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setLocation(`/create-shop-user/${user.id}`)} className="flex items-center gap-2">
                                                            <Edit className="h-4 w-4" />
                                                            Edit User
                                                        </DropdownMenuItem>
                                                        {user.isActive && (
                                                            <DropdownMenuItem
                                                                className="flex items-center gap-2 text-red-600"
                                                                onClick={() => handleDeactivateUser(user.id, `${user.firstName} ${user.lastName}`)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Deactivate User
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {paginatedUsers.length === 0 && (
                                <div className="text-center py-12">
                                    <User className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Try adjusting your search or filter criteria
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {filteredUsers.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredUsers.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                                className="border-t"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Simple Create User Form Component
function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "user",
        shopId: "",
        mobileNo: "",
        address: "",
        agreeTerms: false,
    });

    const { data: shops = [] } = useQuery({ queryKey: ["/api/shops"] });

    const createUserMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/register-shop-users", data);
        },
        onSuccess: () => {
            toast({ title: "✅ Success", description: "User created successfully" });
            onSuccess();
        },
        onError: (error: Error) => {
            toast({ title: "❌ Error", description: error.message, variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createUserMutation.mutate({
            ...formData,
            shopId: formData.shopId || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>First Name *</Label>
                    <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label>Last Name *</Label>
                    <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label>Email *</Label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label>Password *</Label>
                    <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label>Mobile Number *</Label>
                    <Input
                        value={formData.mobileNo}
                        onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label>Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Shop (Optional)</Label>
                    <Select value={formData.shopId} onValueChange={(value) => setFormData({ ...formData, shopId: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select shop" />
                        </SelectTrigger>
                        <SelectContent>
                            {shops?.map((shop: any) => (
                                <SelectItem key={shop.id} value={shop.id}>
                                    {shop.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label>Address *</Label>
                <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                />
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    required
                    className="rounded border-gray-300"
                />
                <Label className="text-sm">I agree to the terms and policies</Label>
            </div>

            <Button
                type="submit"
                disabled={createUserMutation.isPending}
                className="w-full"
            >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
        </form>
    );
}