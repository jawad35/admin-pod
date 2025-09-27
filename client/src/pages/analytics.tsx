import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import StorageChart from "@/components/charts/storage-chart";
import { ServerRequestsChart, RAMUsageChart } from "@/components/charts/analytics-charts";
import { formatCurrency } from "@/lib/currency";

export default function Analytics() {
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

  const { data: stats, isLoading: statsLoading, error } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: shops, isLoading: shopsLoading } = useQuery({
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

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  const topPerformingShops = shops?.slice(0, 5).sort((a: any, b: any) => 
    parseFloat(b.totalRevenue || 0) - parseFloat(a.totalRevenue || 0)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-analytics-title">
          Analytics Dashboard
        </h1>
        <div className="flex space-x-3">
          <Select defaultValue="30">
            <SelectTrigger className="w-40" data-testid="select-time-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage by Shop</CardTitle>
          </CardHeader>
          <CardContent>
            <StorageChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server Requests (Daily)</CardTitle>
          </CardHeader>
          <CardContent>
            <ServerRequestsChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RAM Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <RAMUsageChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shop Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Shops</span>
                <span className="text-sm font-medium">{stats?.activeShops || 0}</span>
              </div>
              <Progress value={((stats?.activeShops || 0) / (stats?.totalShops || 1)) * 100} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Expired Shops</span>
                <span className="text-sm font-medium">{stats?.expiredShops || 0}</span>
              </div>
              <Progress value={((stats?.expiredShops || 0) / (stats?.totalShops || 1)) * 100} className="h-2" />
              
              <div className="text-center pt-4">
                <p className="text-2xl font-bold">{stats?.totalShops || 0}</p>
                <p className="text-sm text-muted-foreground">Total Shops</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance and Top Shops */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>72%</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>68%</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Disk Usage</span>
                  <span>24%</span>
                </div>
                <Progress value={24} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Shops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformingShops.length > 0 ? (
                topPerformingShops.map((shop: any, index: number) => (
                  <div key={shop.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-muted rounded-full w-5 h-5 flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm">{shop.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(shop.totalRevenue)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No shop data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">New Shops This Month</p>
                <p className="text-2xl font-bold text-green-600" data-testid="metric-new-shops">+12</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue Growth</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="metric-revenue-growth">+18.5%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer Retention</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="metric-retention">94.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
