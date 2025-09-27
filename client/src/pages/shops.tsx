import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import ShopsTable from "@/components/tables/shops-table";
import ShopForm from "@/components/forms/shop-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Download, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Shops() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    city: "",
    search: "",
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

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
    // TODO: Implement Excel export
    toast({
      title: "Export Started",
      description: "Shop data export will download shortly",
    });
  };

  const handleImportData = () => {
    // TODO: Implement Excel import
    toast({
      title: "Import Started",
      description: "Shop data import functionality will be available soon",
    });
  };

  const filteredShops = shops?.filter((shop: any) => {
    if (filters.type && shop.type !== filters.type) return false;
    if (filters.status && shop.subscriptionStatus !== filters.status) return false;
    if (filters.city && shop.city !== filters.city) return false;
    if (filters.search && !shop.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-shops-title">
          Shop Management
        </h1>
        <div className="flex space-x-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-shop">
                <Plus className="mr-2 h-4 w-4" />
                Add Shop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Shop</DialogTitle>
              </DialogHeader>
              <ShopForm onSuccess={() => setIsAddDialogOpen(false)} />
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
                  <SelectItem value="">All Types</SelectItem>
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
                  <SelectItem value="">All Status</SelectItem>
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
                  <SelectItem value="">All Cities</SelectItem>
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
      />
    </div>
  );
}
