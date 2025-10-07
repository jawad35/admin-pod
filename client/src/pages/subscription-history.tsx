import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import {
    Plus,
    Calendar,
    DollarSign,
    Filter,
    Search,
    CheckCircle,
    Clock,
    XCircle
} from "lucide-react";
import { useParams } from "wouter";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 20;

export default function ShopSubscriptionHistory() {
    const { toast } = useToast();
    const { shopId } = useParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingSubscription, setEditingSubscription] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newSubscription, setNewSubscription] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        status: "paid",
        notes: "",
        planId: ""
    });

    const { data: subscriptionPlans = [] } = useQuery({
        queryKey: ["/api/subscription-plans"],
    });

    // Fetch shop details
    const { data: shop } = useQuery({
        queryKey: [`/api/shops/${shopId}`],
        enabled: !!shopId,
    });

    // Fetch subscription history
    const { data: subscriptions = [], isLoading, refetch } = useQuery({
        queryKey: [`/api/shops/${shopId}/subscriptions`],
        enabled: !!shopId,
    });


    // Add subscription mutation
    const addSubscriptionMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", `/api/shops/${shopId}/subscriptions`, data);
        },
        onSuccess: () => {
            toast({ title: "✅ Success", description: "Subscription added successfully" });
            setIsDialogOpen(false)
            setNewSubscription({
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                status: "paid",
                notes: "",
                planId: ""
            });
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: "❌ Error", description: error.message, variant: "destructive" });
        },
    });

    // Add these mutations after your addSubscriptionMutation
    // Delete subscription mutation
    const deleteSubscriptionMutation = useMutation({
        mutationFn: async (subscriptionId: string) => {
            return await apiRequest("DELETE", `/api/subscriptions/${subscriptionId}`);
        },
        onSuccess: () => {
            toast({ title: "✅ Success", description: "Subscription deleted successfully" });
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: "❌ Error", description: error.message, variant: "destructive" });
        },
    });

    // Update subscription mutation
    const updateSubscriptionMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return await apiRequest("PUT", `/api/subscriptions/${id}`, data);
        },
        onSuccess: () => {
            toast({ title: "✅ Success", description: "Subscription updated successfully" });
            setIsDialogOpen(false)
            setNewSubscription({
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                status: "paid",
                notes: "",
                planId: ""
            });
            setEditingSubscription(null)
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: "❌ Error", description: error.message, variant: "destructive" });
        },
    });

    // Add edit state

    const handleEdit = (subscription: any) => {
        setEditingSubscription(subscription);
        setNewSubscription({
            month: subscription.month,
            year: subscription.year,
            status: subscription.status,
            notes: subscription.notes || "",
            planId: subscription.planId
        });
        setIsDialogOpen(true);
    };

    // Delete handler
    const handleDelete = (subscriptionId: string, period: string) => {
        if (confirm(`Are you sure you want to delete subscription for ${period}?`)) {
            deleteSubscriptionMutation.mutate(subscriptionId);
        }
    };

    // Unified submit handler
    const handleSubmit = () => {
        if (!newSubscription.planId) {
            toast({ title: "❌ Error", description: "Please select a subscription plan", variant: "destructive" });
            return;
        }

        if (editingSubscription) {
            // Update existing subscription
            updateSubscriptionMutation.mutate({
                id: editingSubscription.id,
                data: newSubscription
            });
        } else {
            // Create new subscription
            addSubscriptionMutation.mutate(newSubscription);
        }
    };
    // Filter subscriptions
    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter((sub: any) => {
            const matchesSearch =
                sub.notes?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [subscriptions, searchTerm, statusFilter]);

    // Paginate subscriptions
    const paginatedSubscriptions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSubscriptions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSubscriptions, currentPage]);

    const totalPages = Math.ceil(filteredSubscriptions.length / ITEMS_PER_PAGE);

    // Status badge
    const getStatusBadge = (status: string) => {
        const variants = {
            paid: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
            pending: { variant: "secondary" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
            cancelled: { variant: "outline" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
        };

        const config = variants[status as keyof typeof variants] || variants.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className={`flex items-center gap-1 w-fit ${config.className}`}>
                <Icon className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    // Month names for display
    const getMonthName = (month: number) => {
        return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
    };

    // Update the form to include plan selection
    <div className="space-y-4">
        {/* Add this plan selection field */}
        <div>
            <Label>Subscription Plan *</Label>
            <Select
                value={newSubscription.planId}
                onValueChange={(value) => setNewSubscription({ ...newSubscription, planId: value })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                    {subscriptionPlans?.map((plan: any) => (
                        <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex justify-between items-center w-full">
                                <span>{plan.name}</span>
                                <span className="text-sm font-semibold text-blue-600">
                                    Rs{plan.price}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* Rest of your existing form fields */}

    </div>

    // Update the submit handler to include planId
    const handleAddSubscription = () => {
        if (!newSubscription.planId) {
            toast({ title: "❌ Error", description: "Please select a subscription plan", variant: "destructive" });
            return;
        }

        addSubscriptionMutation.mutate({
            ...newSubscription,
            planId: newSubscription.planId, // Include planId
        });
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
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Subscription History - {shop?.name || "Shop"}
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage and track subscription payments for this shop
                            </p>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Subscription
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingSubscription ? "Edit Subscription" : "Add New Subscription"}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Subscription Plan *</Label>
                                        <Select
                                            value={newSubscription.planId}
                                            onValueChange={(value) => setNewSubscription({ ...newSubscription, planId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a plan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subscriptionPlans?.map((plan: any) => (
                                                    <SelectItem key={plan.id} value={plan.id}>
                                                        <div className="flex justify-between items-center w-full">
                                                            <span>{plan.name}</span>
                                                            <span className="text-sm font-semibold text-blue-600">
                                                                Rs{plan.price}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Month</Label>
                                            <Select
                                                value={newSubscription.month.toString()}
                                                onValueChange={(value) => setNewSubscription({ ...newSubscription, month: parseInt(value) })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 12 }, (_, i) => (
                                                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                            {getMonthName(i + 1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Year</Label>
                                            <Input
                                                type="number"
                                                value={newSubscription.year}
                                                onChange={(e) => setNewSubscription({ ...newSubscription, year: parseInt(e.target.value) })}
                                                placeholder="2024"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Status</Label>
                                        <Select
                                            value={newSubscription.status}
                                            onValueChange={(value) => setNewSubscription({ ...newSubscription, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Notes</Label>
                                        <Input
                                            value={newSubscription.notes}
                                            onChange={(e) => setNewSubscription({ ...newSubscription, notes: e.target.value })}
                                            placeholder="Payment notes..."
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={addSubscriptionMutation.isPending || updateSubscriptionMutation.isPending}
                                        className="w-full"
                                    >
                                        {addSubscriptionMutation.isPending || updateSubscriptionMutation.isPending
                                            ? (editingSubscription ? "Updating..." : "Adding...")
                                            : (editingSubscription ? "Update Subscription" : "Add Subscription")
                                        }
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <Card>
                        <CardContent className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search subscriptions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="text-sm text-gray-600 flex items-center">
                                    <Filter className="h-4 w-4 mr-2" />
                                    {filteredSubscriptions.length} records found
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Subscriptions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Subscription History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead>Date Added</TableHead>
                                        <TableHead>Actions</TableHead> {/* Add this */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedSubscriptions.map((subscription: any) => (
                                        <TableRow key={subscription.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="font-medium">
                                                    {getMonthName(subscription.month)} {subscription.year}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(subscription.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-gray-600">
                                                    Rs{subscriptionPlans?.find((p: any) => p.id === subscription.planId)?.price || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-600 max-w-xs truncate">
                                                    {subscription.notes || "No notes"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-500">
                                                    {format(new Date(subscription.createdAt), "MMM dd, yyyy")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(subscription)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDelete(
                                                            subscription.id,
                                                            `${getMonthName(subscription.month)} ${subscription.year}`
                                                        )}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>


                            {paginatedSubscriptions.length === 0 && (
                                <div className="text-center py-12">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {subscriptions.length === 0
                                            ? "Get started by adding the first subscription."
                                            : "Try adjusting your search criteria."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {filteredSubscriptions.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredSubscriptions.length}
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