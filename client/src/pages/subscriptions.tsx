import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Plus, CreditCard, Calendar, Gift, Users } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

export default function Subscriptions() {
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

  const { data: subscriptions, isLoading: subscriptionsLoading, error } = useQuery({
    queryKey: ["/api/subscriptions"],
    retry: false,
  });

  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ["/api/shops"],
    retry: false,
  });

  const { data: referrals } = useQuery({
    queryKey: ["/api/referrals"],
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

  const getPlanTypeColor = (planType: string) => {
    switch (planType) {
      case "monthly":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "yearly":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "permanent":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getShopName = (shopId: string) => {
    const shop = shops?.find((s: any) => s.id === shopId);
    return shop?.name || "Unknown Shop";
  };

  // Calculate subscription stats
  const stats = {
    totalSubscriptions: subscriptions?.length || 0,
    monthlyRevenue: subscriptions?.reduce((sum: number, sub: any) => 
      sub.planType === 'monthly' && sub.isActive ? sum + parseFloat(sub.amount || 0) : sum, 0) || 0,
    yearlyRevenue: subscriptions?.reduce((sum: number, sub: any) => 
      sub.planType === 'yearly' && sub.isActive ? sum + parseFloat(sub.amount || 0) : sum, 0) || 0,
    referralDiscounts: referrals?.filter((ref: any) => ref.isActive).length || 0,
  };

  if (subscriptionsLoading || shopsLoading) {
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
        <h1 className="text-2xl font-bold" data-testid="text-subscriptions-title">
          Subscriptions & Licensing
        </h1>
        <div className="flex space-x-3">
          <Button data-testid="button-add-subscription">
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Subscription Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Subscriptions
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-subscriptions">
                  {stats.totalSubscriptions}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold" data-testid="stat-monthly-revenue">
                  {formatCurrency(stats.monthlyRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Yearly Revenue
                </p>
                <p className="text-2xl font-bold" data-testid="stat-yearly-revenue">
                  {formatCurrency(stats.yearlyRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Referral Discounts
                </p>
                <p className="text-2xl font-bold" data-testid="stat-referral-discounts">
                  {stats.referralDiscounts}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Gift className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Shop</TableHead>
                  <TableHead>Plan Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions && subscriptions.length > 0 ? (
                  subscriptions.map((subscription: any) => (
                    <TableRow
                      key={subscription.id}
                      className="hover:bg-muted/50"
                      data-testid={`subscription-row-${subscription.id}`}
                    >
                      <TableCell>
                        <p className="text-sm font-medium">
                          {getShopName(subscription.shopId)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanTypeColor(subscription.planType)}>
                          {subscription.planType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {formatCurrency(subscription.amount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {formatDate(subscription.startDate)}
                          </p>
                          {subscription.endDate && (
                            <p className="text-sm text-muted-foreground">
                              to {formatDate(subscription.endDate)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {subscription.discount}%
                          </p>
                          {subscription.referralDiscount && (
                            <Badge variant="outline" className="text-xs">
                              Referral
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            subscription.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }
                        >
                          {subscription.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-view-${subscription.id}`}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-edit-${subscription.id}`}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No subscriptions found</p>
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
