import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Store,
  CheckCircle,
  TrendingUp,
  HardDrive,
  Users,
  Receipt,
  AlertTriangle,
  PieChart,
  Plus,
  Download,
  RefreshCw,
  Ban,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import RevenueChart from "@/components/charts/revenue-chart";
import ShopGrowthChart from "@/components/charts/shop-growth-chart";

// Type definitions
interface DashboardStats {
  totalShops: number;
  activeShops: number;
  expiredShops: number;
  totalRevenue: string;
  totalStorage: string;
  totalEmployees: number;
  totalExpenses: string;
  activeComplaints: number;
  churnRate: string;
}

interface Shop {
  id: string;
  name: string;
  expiryDate: string;
  monthlyFee: string;
  [key: string]: any;
}

export default function Dashboard() {
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

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: expiredShops, isLoading: expiredLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops/expired"],
    retry: false,
  });

  // Provide safe defaults for stats
  const safeStats = stats || {
    totalShops: 0,
    activeShops: 0,
    expiredShops: 0,
    totalRevenue: "0",
    totalStorage: "0",
    totalEmployees: 0,
    totalExpenses: "0",
    activeComplaints: 0,
    churnRate: "0"
  };

  // Provide safe defaults for expired shops
  const safeExpiredShops = expiredShops || [];

  if (statsError && isUnauthorizedError(statsError as Error)) {
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

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
          Dashboard Overview
        </h1>
        <div className="flex space-x-3">
          <Button data-testid="button-add-shop">
            <Plus className="mr-2 h-4 w-4" />
            Add Shop
          </Button>
          <Button variant="outline" data-testid="button-backup-data">
            <Download className="mr-2 h-4 w-4" />
            Backup Data
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Shops
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-shops">
                  {safeStats.totalShops}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Subscriptions
                </p>
                <p className="text-2xl font-bold" data-testid="stat-active-subscriptions">
                  {safeStats.activeShops}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {safeStats.expiredShops} expired
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
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
                  {formatCurrency(safeStats.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +8.2% this month
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Storage Used
                </p>
                <p className="text-2xl font-bold" data-testid="stat-storage-used">
                  {parseFloat(safeStats.totalStorage).toFixed(1)} GB
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  of 10 TB available
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Employees
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-employees">
                  {safeStats.totalEmployees}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sales team members
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Office Expenses
                </p>
                <p className="text-2xl font-bold" data-testid="stat-office-expenses">
                  {formatCurrency(safeStats.totalExpenses)}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +3.5% this month
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <Receipt className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Complaints
                </p>
                <p className="text-2xl font-bold" data-testid="stat-active-complaints">
                  {safeStats.activeComplaints}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  86 resolved this month
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Churn Rate
                </p>
                <p className="text-2xl font-bold" data-testid="stat-churn-rate">
                  {safeStats.churnRate}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1 rotate-180" />
                  -1.1% improvement
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center">
                <PieChart className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends (PKR)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shop Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ShopGrowthChart />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              Shops Expired & Need Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiredLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))
              ) : safeExpiredShops.length > 0 ? (
                safeExpiredShops.map((shop: any) => (
                  <div
                    key={shop.id}
                    className="flex items-center justify-between p-3 bg-destructive/10 rounded-md border border-destructive/20"
                    data-testid={`expired-shop-${shop.id}`}
                  >
                    <div>
                      <p className="font-medium">{shop.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Expired {new Date(shop.expiryDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Monthly Fee: {formatCurrency(shop.monthlyFee)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        data-testid={`button-renew-${shop.id}`}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Renew
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        data-testid={`button-revoke-${shop.id}`}
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No expired shops requiring attention
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    New shop registered: Lahore Fashion Hub
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Payment received: ₨ 20,000 from Islamabad Tech
                  </p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    New complaint from Peshawar Electronics
                  </p>
                  <p className="text-xs text-muted-foreground">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
