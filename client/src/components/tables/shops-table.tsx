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
import { Eye, Edit, RefreshCw, Ban } from "lucide-react";
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
}

interface ShopsTableProps {
  shops: Shop[];
  isLoading: boolean;
  onDelete: (shopId: string) => void;
  onEdit: (shop: Shop) => void;
  onView: (shop: Shop) => void;
  onRenew: (shop: Shop) => void;
}

export default function ShopsTable({ 
  shops, 
  isLoading, 
  onDelete, 
  onEdit, 
  onView, 
  onRenew 
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

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Shop Details</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
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
              shops.map((shop) => (
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
                          {shop.city}, Pakistan
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
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(shop.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">
                      {formatCurrency(shop.totalRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total paid</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(shop.subscriptionStatus)}>
                      {shop.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onView(shop)}
                        data-testid={`button-view-${shop.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(shop)}
                        data-testid={`button-edit-${shop.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRenew(shop)}
                        data-testid={`button-renew-${shop.id}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(shop.id)}
                        data-testid={`button-delete-${shop.id}`}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}