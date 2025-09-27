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
import { Wrench, Clock, CheckCircle, AlertCircle, User, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Maintenance() {
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

  const { data: maintenanceTasks, isLoading: maintenanceLoading, error } = useQuery({
    queryKey: ["/api/maintenance"],
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

  const updateMaintenanceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/maintenance/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({
        title: "Success",
        description: "Maintenance task updated successfully",
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
        description: "Failed to update maintenance task",
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

  const getShopName = (shopId: string | null) => {
    if (!shopId) return "General";
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
      case "open":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "done":
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

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateMaintenanceMutation.mutate({
      id: taskId,
      data: { status: newStatus }
    });
  };

  const handleAssignEmployee = (taskId: string, employeeId: string) => {
    updateMaintenanceMutation.mutate({
      id: taskId,
      data: { assignedTo: employeeId === "unassigned" ? null : employeeId }
    });
  };

  // Calculate maintenance statistics
  const stats = maintenanceTasks ? {
    totalTasks: maintenanceTasks.length,
    openTasks: maintenanceTasks.filter((task: any) => task.status === "open").length,
    inProgressTasks: maintenanceTasks.filter((task: any) => task.status === "in_progress").length,
    completedTasks: maintenanceTasks.filter((task: any) => task.status === "done").length,
  } : {
    totalTasks: 0,
    openTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
  };

  if (maintenanceLoading) {
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
        <h1 className="text-2xl font-bold" data-testid="text-maintenance-title">
          Maintenance Tasks
        </h1>
        <Button data-testid="button-add-maintenance">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Maintenance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-tasks">
                  {stats.totalTasks}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Open Tasks
                </p>
                <p className="text-2xl font-bold" data-testid="stat-open-tasks">
                  {stats.openTasks}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Progress
                </p>
                <p className="text-2xl font-bold" data-testid="stat-in-progress-tasks">
                  {stats.inProgressTasks}
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
                  Completed
                </p>
                <p className="text-2xl font-bold" data-testid="stat-completed-tasks">
                  {stats.completedTasks}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Maintenance Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Task</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceTasks && maintenanceTasks.length > 0 ? (
                  maintenanceTasks.map((task: any) => (
                    <TableRow
                      key={task.id}
                      className="hover:bg-muted/50"
                      data-testid={`maintenance-row-${task.id}`}
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{getShopName(task.shopId)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {getEmployeeName(task.assignedTo)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === "in_progress" ? "In Progress" : task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusChange(task.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={task.assignedTo || "unassigned"}
                            onValueChange={(value) => handleAssignEmployee(task.id, value)}
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
                      <p className="text-muted-foreground">No maintenance tasks found</p>
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
