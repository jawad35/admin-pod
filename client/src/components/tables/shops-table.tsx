// components/tables/shops-table.tsx

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit, RefreshCw, Ban, Calendar, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

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
  subscriptionPlanId?: string;
  permanentLicense?: boolean;
}

interface ShopsTableProps {
  shops: Shop[];
  isLoading: boolean;
  onDelete: (shopId: string) => void;
  onEdit: (shop: Shop) => void;
  onView: (shop: Shop) => void;
  onRenew: (shop: Shop) => void;
  onViewPaymentHistory: (shop: Shop) => void;
}

export default function ShopsTable({ 
  shops, 
  isLoading, 
  onDelete, 
  onEdit, 
  onView, 
  onRenew,
  onViewPaymentHistory 
}: ShopsTableProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 mb-4" />
          ))}
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "suspended":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadgeColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return "text-red-600";
    if (daysUntilExpiry < 7) return "text-orange-600";
    if (daysUntilExpiry < 30) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-[250px]">Shop Details</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No shops found</p>
                </TableCell>
              </TableRow>
            ) : (
              shops.map((shop) => {
                const daysUntilExpiry = getDaysUntilExpiry(shop.expiryDate);
                const expiryBadgeColor = getExpiryBadgeColor(daysUntilExpiry);
                
                return (
                  <TableRow
                    key={shop.id}
                    className="hover:bg-muted/50"
                    data-testid={`shop-row-${shop.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mr-3">
                          {shop.imageUrl ? (
                            <img
                              src={shop.imageUrl}
                              alt={shop.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {shop.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium" data-testid={`shop-name-${shop.id}`}>
                            {shop.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {shop.shopId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {shop.city}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{shop.owner}</p>
                        <p className="text-sm text-muted-foreground">{shop.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {shop.type} Plan
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(shop.monthlyFee)}/month
                        </p>
                        {shop.discount && parseFloat(shop.discount) > 0 && (
                          <p className="text-xs text-green-600">
                            {shop.discount}% discount applied
                          </p>
                        )}
                        <p className={`text-xs ${expiryBadgeColor} mt-1`}>
                          {daysUntilExpiry < 0 
                            ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                            : `${daysUntilExpiry} days remaining`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(shop.totalRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total paid</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getStatusColor(shop.subscriptionStatus)}>
                          {shop.subscriptionStatus}
                        </Badge>
                        {shop.permanentLicense && (
                          <Badge variant="outline" className="block text-xs">
                            Permanent License
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(shop)}
                          data-testid={`button-view-${shop.id}`}
                          title="View Shop Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(shop)}
                          data-testid={`button-edit-${shop.id}`}
                          title="Edit Shop"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewPaymentHistory(shop)}
                          data-testid={`button-payment-history-${shop.id}`}
                          title="View Payment History"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRenew(shop)}
                          data-testid={`button-renew-${shop.id}`}
                          title="Renew Subscription"
                          disabled={shop.permanentLicense}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(shop.id)}
                          data-testid={`button-delete-${shop.id}`}
                          title="Delete Shop"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Summary Footer */}
      {shops.length > 0 && (
        <div className="border-t p-4 bg-muted/30">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Total Shops: <span className="font-semibold text-foreground">{shops.length}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Revenue: <span className="font-semibold text-green-600">
                {formatCurrency(shops.reduce((sum, shop) => sum + parseFloat(shop.totalRevenue || "0"), 0))}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Active Subscriptions: <span className="font-semibold text-foreground">
                {shops.filter(shop => shop.subscriptionStatus === "active").length}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Expiring Soon (&lt;30 days): <span className="font-semibold text-orange-600">
                {shops.filter(shop => {
                  const days = getDaysUntilExpiry(shop.expiryDate);
                  return days > 0 && days <= 30;
                }).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}