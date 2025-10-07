import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, CreditCard, Calendar, Gift, Users, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export default function Subscriptions() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationDays: "",
    features: "",
    isActive: true,
  });

  // Fetch subscription plans
  const { data: subscriptionPlans, isLoading: plansLoading, refetch } = useQuery({
    queryKey: ["/api/subscription-plans"],
    retry: false,
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/subscription-plans", data);
    },
    onSuccess: () => {
      toast({ title: "✅ Success", description: "Plan created successfully" });
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: "❌ Error", description: error.message, variant: "destructive" });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/subscription-plans/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "✅ Success", description: "Plan updated successfully" });
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: "❌ Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PUT", `/api/subscription-plans/${id}`, { isActive: false });
    },
    onSuccess: () => {
      toast({ title: "✅ Success", description: "Plan deleted successfully" });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: "❌ Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      durationDays: "",
      features: "",
      isActive: true,
    });
    setSelectedPlan(null);
  };

  // In your component, change the features handling:
  const handleCreate = () => {
    try {
      createPlanMutation.mutate({
        ...formData,
        price: parseFloat(formData.price),
        durationDays: parseInt(formData.durationDays),
        features: formData.features ? JSON.parse(formData.features) : [], // Handle empty case
      });
    } catch (error) {
      toast({
        title: "❌ Invalid JSON",
        description: "Features must be valid JSON array",
        variant: "destructive"
      });
    }
  };

  const handleEdit = () => {
    if (!selectedPlan) return;
    updatePlanMutation.mutate({
      id: selectedPlan.id,
      data: {
        ...formData,
        price: parseFloat(formData.price),
        durationDays: parseInt(formData.durationDays),
        features: formData.features ? JSON.parse(formData.features) : [],
      },
    });
  };

  const handleDelete = () => {
    if (!selectedPlan) return;
    deletePlanMutation.mutate(selectedPlan.id);
  };

  const openEditDialog = (plan: any) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      durationDays: plan.durationDays.toString(),
      features: plan.features ? JSON.stringify(plan.features, null, 2) : "",
      isActive: plan.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (plan: any) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  // Calculate stats based on subscription plans
  const stats = {
    totalPlans: subscriptionPlans?.length || 0,
    activePlans: subscriptionPlans?.filter((p: any) => p.isActive).length || 0,
    averagePrice: subscriptionPlans?.length
      ? subscriptionPlans.reduce((sum: number, p: any) => sum + parseFloat(p.price), 0) / subscriptionPlans.length
      : 0,
    totalValue: subscriptionPlans?.reduce((sum: number, p: any) => sum + parseFloat(p.price), 0) || 0,
  };

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plan Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basic Monthly"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plan description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Duration (Days)</Label>
                  <Input
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <Label>Features (JSON array)</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder='["Feature 1", "Feature 2"]'
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label>Active Plan</Label>
              </div>
              <Button
                onClick={handleCreate}
                disabled={createPlanMutation.isPending}
                className="w-full"
              >
                {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">{stats.totalPlans}</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Plans</p>
                <p className="text-2xl font-bold">{stats.activePlans}</p>
              </div>
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.averagePrice)}</p>
              </div>
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
              <Gift className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptionPlans?.map((plan: any) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(plan.price)}</TableCell>
                  <TableCell>{plan.durationDays} days</TableCell>
                  <TableCell>
                    {plan.features?.slice(0, 2).map((feature: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="mr-1 mb-1">
                        {feature}
                      </Badge>
                    ))}
                    {plan.features?.length > 2 && (
                      <Badge variant="secondary">+{plan.features.length - 2} more</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(plan)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Duration (Days)</Label>
                <Input
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Features (JSON array)</Label>
              <Textarea
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active Plan</Label>
            </div>
            <Button
              onClick={handleEdit}
              disabled={updatePlanMutation.isPending}
              className="w-full"
            >
              {updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPlan?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePlanMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}