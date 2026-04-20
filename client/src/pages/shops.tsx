// pages/shops.tsx (Updated with payment history modal)

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import ShopsTable from "@/components/tables/shops-table";
import ShopForm from "@/components/forms/shop-form";
import { PaymentHistoryModal } from "@/components/modals/payment-history-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Download, Upload } from "lucide-react";

interface Shop {
  id: string;
  shopId: string;
  name: string;
  owner: string;
  email: string;
  type: string;
  city: string;
  location: string;
  subscriptionStatus: string;
  monthlyFee: string;
  discount: string;
  expiryDate: string;
  totalRevenue: string;
  imageUrl?: string;
  permanentLicense?: boolean;
  storageUsed?: string;
  storageLimit?: string;
  referral?: string;
}

export default function Shops() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [selectedShopForPayment, setSelectedShopForPayment] = useState<Shop | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    city: "all",
    search: "",
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: shops, isLoading: shopsLoading, error } = useQuery({
    queryKey: ["/api/shops"],
    retry: false,
  });

  const deleteShopMutation = useMutation({
    mutationFn: async (shopId: string) => {
      await apiRequest("DELETE", `/api/shops/${shopId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      toast({
        title: "Success",
        description: "Shop deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete shop",
        variant: "destructive",
      });
    },
  });

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setIsDialogOpen(true);
  };

  const handleViewShop = (shop: Shop) => {
    toast({
      title: "View Shop",
      description: `Viewing details for ${shop.name}`,
    });
  };

  const handleRenewShop = (shop: Shop) => {
    toast({
      title: "Renew Subscription",
      description: `Renewing subscription for ${shop.name}`,
    });
  };

  const handleViewPaymentHistory = (shop: Shop) => {
    setSelectedShopForPayment(shop);
    setIsPaymentModalOpen(true);
  };

  const handleAddShop = () => {
    setEditingShop(null);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingShop(null);
    queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingShop(null);
    }
  };

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const handleDeleteShop = (shopId: string) => {
    if (confirm("Are you sure you want to delete this shop?")) {
      deleteShopMutation.mutate(shopId);
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Shop data export will download shortly",
    });
  };

  const handleImportData = () => {
    toast({
      title: "Import Started",
      description: "Shop data import functionality will be available soon",
    });
  };

  const safeShops = shops || [];
  
  const filteredShops = safeShops.filter((shop: any) => {
    if (filters.type !== "all" && shop.type !== filters.type) return false;
    if (filters.status !== "all" && shop.subscriptionStatus !== filters.status) return false;
    if (filters.city !== "all" && shop.city !== filters.city) return false;
    if (filters.search && !shop.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Calculate total revenue for filtered shops
  const totalRevenue = filteredShops.reduce((sum: number, shop: any) => {
    return sum + parseFloat(shop.totalRevenue || "0");
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-shops-title">
            Shop Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Total Revenue: PKR {totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={handleAddShop} data-testid="button-add-shop">
                <Plus className="mr-2 h-4 w-4" />
                Add Shop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingShop ? `Edit ${editingShop.name}` : "Add New Shop"}
                </DialogTitle>
              </DialogHeader>
              <ShopForm 
                shop={editingShop || undefined}
                onSuccess={handleFormSuccess} 
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportData} data-testid="button-export-excel">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handleImportData} data-testid="button-import-data">
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2">Shop Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger data-testid="select-shop-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="salon">Salon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2">Subscription Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger data-testid="select-subscription-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2">City</Label>
              <Select
                value={filters.city}
                onValueChange={(value) => setFilters({ ...filters, city: value })}
              >
                <SelectTrigger data-testid="select-city">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Karachi">Karachi</SelectItem>
                  <SelectItem value="Lahore">Lahore</SelectItem>
                  <SelectItem value="Islamabad">Islamabad</SelectItem>
                  <SelectItem value="Peshawar">Peshawar</SelectItem>
                  <SelectItem value="Quetta">Quetta</SelectItem>
                  <SelectItem value="Faisalabad">Faisalabad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2">Search</Label>
              <Input
                type="text"
                placeholder="Search shops..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                data-testid="input-search-shops"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ShopsTable
        shops={filteredShops || []}
        isLoading={shopsLoading}
        onDelete={handleDeleteShop}
        onEdit={handleEditShop}
        onView={handleViewShop}
        onRenew={handleRenewShop}
        onViewPaymentHistory={handleViewPaymentHistory}
      />

      <PaymentHistoryModal
        shop={selectedShopForPayment}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
}