import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Headphones, AlertTriangle, CheckCircle, Clock, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Support() {
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

  const { data: complaints, isLoading: complaintsLoading, error } = useQuery({
    queryKey: ["/api/complaints"],
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

  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/complaints/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({
        title: "Success",
        description: "Complaint updated successfully",
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
        description: "Failed to update complaint",
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

  const getShopName = (shopId: string) => {
    const shop = shops?.find((s: any) => s.id === shopId);
    return shop?.name || "Unknown Shop";
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Unassigned";
    const employee = employees?.find((e: any) => e.id === employeeId);
    return employee?.name || "Unknown Employee";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleStatusChange = (complaintId: string, newStatus: string) => {
    updateComplaintMutation.mutate({
      id: complaintId,
      data: { status: newStatus }
    });
  };

  const handleAssignEmployee = (complaintId: string, employeeId: string) => {
    updateComplaintMutation.mutate({
      id: complaintId,
      data: { employeeId: employeeId === "unassigned" ? null : employeeId }
    });
  };

  // Calculate support statistics
  const stats = complaints ? {
    totalComplaints: complaints.length,
    activeComplaints: complaints.filter((c: any) => c.status === "active").length,
    pendingComplaints: complaints.filter((c: any) => c.status === "pending").length,
    resolvedComplaints: complaints.filter((c: any) => c.status === "resolved").length,
  } : {
    totalComplaints: 0,
    activeComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
  };

  if (complaintsLoading) {
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
        <h1 className="text-2xl font-bold" data-testid="text-support-title">
          Support & Complaints
        </h1>
      </div>

      {/* Support Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Complaints
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-complaints">
                  {stats.totalComplaints}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Headphones className="h-6 w-6 text-blue-600" />
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
                  {stats.activeComplaints}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold" data-testid="stat-pending-complaints">
                  {stats.pendingComplaints}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Resolved
                </p>
                <p className="text-2xl font-bold" data-testid="stat-resolved-complaints">
                  {stats.resolvedComplaints}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Complaint</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints && complaints.length > 0 ? (
                  complaints.map((complaint: any) => (
                    <TableRow
                      key={complaint.id}
                      className="hover:bg-muted/50"
                      data-testid={`complaint-row-${complaint.id}`}
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{complaint.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {complaint.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{getShopName(complaint.shopId)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {getEmployeeName(complaint.employeeId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {formatDate(complaint.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select
                            value={complaint.status}
                            onValueChange={(value) => handleStatusChange(complaint.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={complaint.employeeId || "unassigned"}
                            onValueChange={(value) => handleAssignEmployee(complaint.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {employees?.map((employee: any) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No complaints found</p>
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
