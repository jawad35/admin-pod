import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UserPlus, Gift, DollarSign, Users } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

export default function Referrals() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: referrals, isLoading: referralsLoading, error } = useQuery({
    queryKey: ["/api/referrals"],
    retry: false,
  });

  const { data: shops } = useQuery({
    queryKey: ["/api/shops"],
    retry: false,
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

  const getShopName = (shopId: string) => {
    const shop = shops?.find((s: any) => s.id === shopId);
    return shop?.name || "Unknown Shop";
  };

  // Calculate referral statistics
  const stats = referrals ? {
    totalReferrals: referrals.length,
    activeReferrals: referrals.filter((ref: any) => ref.isActive).length,
    totalDiscountAmount: referrals.reduce((sum: number, ref: any) => 
      sum + parseFloat(ref.discountAmount || 0), 0),
    averageDiscount: referrals.length > 0 
      ? referrals.reduce((sum: number, ref: any) => sum + parseFloat(ref.discountPercentage || 0), 0) / referrals.length
      : 0,
  } : {
    totalReferrals: 0,
    activeReferrals: 0,
    totalDiscountAmount: 0,
    averageDiscount: 0,
  };

  if (referralsLoading) {
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
        <h1 className="text-2xl font-bold" data-testid="text-referrals-title">
          Referral Management
        </h1>
      </div>

      {/* Referral Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Referrals
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-referrals">
                  {stats.totalReferrals}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Referrals
                </p>
                <p className="text-2xl font-bold" data-testid="stat-active-referrals">
                  {stats.activeReferrals}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Discount Given
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-discount">
                  {formatCurrency(stats.totalDiscountAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Discount
                </p>
                <p className="text-2xl font-bold" data-testid="stat-average-discount">
                  {stats.averageDiscount.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Program Info */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Program Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">How It Works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Existing shops can refer new customers</li>
                <li>• New customers get 20% discount on first subscription</li>
                <li>• Referrer gets credit for future payments</li>
                <li>• Discounts are automatically applied to invoices</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Terms & Conditions</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Valid for new customers only</li>
                <li>• Discount applies to first month/year subscription</li>
                <li>• Cannot be combined with other offers</li>
                <li>• Subject to approval and verification</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Referrer Shop</TableHead>
                  <TableHead>Referred Shop</TableHead>
                  <TableHead>Discount Amount</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals && referrals.length > 0 ? (
                  referrals.map((referral: any) => (
                    <TableRow
                      key={referral.id}
                      className="hover:bg-muted/50"
                      data-testid={`referral-row-${referral.id}`}
                    >
                      <TableCell>
                        <p className="text-sm font-medium">
                          {getShopName(referral.referrerShopId)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {getShopName(referral.referredShopId)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {formatCurrency(referral.discountAmount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {referral.discountPercentage}%
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {formatDate(referral.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            referral.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }
                        >
                          {referral.isActive ? "Active" : "Expired"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No referrals found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
