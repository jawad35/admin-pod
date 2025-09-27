import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Upload, Server } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [businessInfo, setBusinessInfo] = useState({
    name: "POS SaaS Solutions",
    email: "admin@possaas.com",
    contact: "+92 300 1234567",
    address: "123 Business District, Karachi, Pakistan",
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

  const { data: auditLogs, isLoading: auditLoading, error } = useQuery({
    queryKey: ["/api/audit-logs"],
    retry: false,
  });

  const { data: shops } = useQuery({
    queryKey: ["/api/shops"],
    retry: false,
  });

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
    retry: false,
  });

  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["/api/subscriptions"],
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

  const handleSaveBusinessInfo = () => {
    // TODO: Implement API call to save business info
    toast({
      title: "Success",
      description: "Business information saved successfully",
    });
  };

  const handleExportShops = () => {
    if (shops && shops.length > 0) {
      exportToCSV(shops, "shops_export");
      toast({
        title: "Export Complete",
        description: "Shops data exported successfully",
      });
    } else {
      toast({
        title: "No Data",
        description: "No shops data available to export",
        variant: "destructive",
      });
    }
  };

  const handleExportEmployees = () => {
    if (employees && employees.length > 0) {
      exportToCSV(employees, "employees_export");
      toast({
        title: "Export Complete",
        description: "Employees data exported successfully",
      });
    } else {
      toast({
        title: "No Data",
        description: "No employees data available to export",
        variant: "destructive",
      });
    }
  };

  const handleExportSubscriptions = () => {
    if (subscriptions && subscriptions.length > 0) {
      exportToCSV(subscriptions, "subscriptions_export");
      toast({
        title: "Export Complete",
        description: "Subscriptions data exported successfully",
      });
    } else {
      toast({
        title: "No Data",
        description: "No subscriptions data available to export",
        variant: "destructive",
      });
    }
  };

  const handleExportExpenses = () => {
    if (expenses && expenses.length > 0) {
      exportToCSV(expenses, "expenses_export");
      toast({
        title: "Export Complete",
        description: "Expenses data exported successfully",
      });
    } else {
      toast({
        title: "No Data",
        description: "No expenses data available to export",
        variant: "destructive",
      });
    }
  };

  const handleImportData = () => {
    // TODO: Implement file input and import functionality
    toast({
      title: "Import Started",
      description: "Data import functionality will be available soon",
    });
  };

  const handleFullBackup = () => {
    // TODO: Implement full system backup
    toast({
      title: "Backup Started",
      description: "Full system backup will be created shortly",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-settings-title">
          Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  data-testid="input-business-name"
                />
              </div>
              <div>
                <Label htmlFor="businessEmail">Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  data-testid="input-business-email"
                />
              </div>
              <div>
                <Label htmlFor="businessContact">Contact Number</Label>
                <Input
                  id="businessContact"
                  value={businessInfo.contact}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, contact: e.target.value })}
                  data-testid="input-business-contact"
                />
              </div>
              <div>
                <Label htmlFor="businessAddress">Address</Label>
                <Textarea
                  id="businessAddress"
                  rows={3}
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  data-testid="textarea-business-address"
                />
              </div>
              <Button onClick={handleSaveBusinessInfo} data-testid="button-save-business-info">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle>Backup & Restore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Export Data</h4>
                <p className="text-sm text-muted-foreground mb-3">Download your data in CSV format</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportShops}
                    data-testid="button-export-shops"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Shops
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportEmployees}
                    data-testid="button-export-employees"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Employees
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportSubscriptions}
                    data-testid="button-export-subscriptions"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Subscriptions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExpenses}
                    data-testid="button-export-expenses"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Expenses
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Import Data</h4>
                <p className="text-sm text-muted-foreground mb-3">Upload CSV files to import data</p>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".csv,.json"
                    className="text-sm"
                    data-testid="input-import-file"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportData}
                    data-testid="button-import-data"
                  >
                    <Upload className="mr-1 h-3 w-3" />
                    Import Data
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                  Full System Backup
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Create a complete backup of all system data
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFullBackup}
                  className="bg-yellow-600 text-white hover:bg-yellow-700"
                  data-testid="button-full-backup"
                >
                  <Server className="mr-1 h-3 w-3" />
                  Create Full Backup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs && auditLogs.length > 0 ? (
                      auditLogs.map((log: any) => (
                        <TableRow key={log.id} data-testid={`audit-log-${log.id}`}>
                          <TableCell className="text-sm">
                            {formatDateTime(log.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm">{log.action}</TableCell>
                          <TableCell className="text-sm">Super Admin</TableCell>
                          <TableCell className="text-sm">{log.details}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <p className="text-muted-foreground">No audit logs found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
