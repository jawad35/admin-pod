import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import EmployeesTable from "@/components/tables/employees-table";
import EmployeeForm from "@/components/forms/employee-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Download, Users, DollarSign, Trophy, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";

export default function Employees() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

  const { data: employees, isLoading: employeesLoading, error } = useQuery({
    queryKey: ["/api/employees"],
    retry: false,
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      await apiRequest("DELETE", `/api/employees/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee deleted successfully",
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
        description: "Failed to delete employee",
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

  const handleDeleteEmployee = (employeeId: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteEmployeeMutation.mutate(employeeId);
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Employee data export will download shortly",
    });
  };

  // Calculate stats from employees data
  const stats = employees ? {
    totalEmployees: employees.length,
    totalSalaries: employees.reduce((sum: number, emp: any) => sum + parseFloat(emp.salary || 0), 0),
    topPerformer: employees.reduce((top: any, emp: any) => 
      parseFloat(emp.totalSales || 0) > parseFloat(top?.totalSales || 0) ? emp : top, 
      employees[0]
    ),
    areasCovered: new Set(employees.map((emp: any) => emp.assignedArea)).size,
  } : {
    totalEmployees: 0,
    totalSalaries: 0,
    topPerformer: null,
    areasCovered: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-employees-title">
          Employee Management
        </h1>
        <div className="flex space-x-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-employee">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <EmployeeForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportData} data-testid="button-export-excel">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Employee Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Employees
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-employees">
                  {stats.totalEmployees}
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
                  Total Salaries
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-salaries">
                  {formatCurrency(stats.totalSalaries)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Top Performer
                </p>
                <p className="text-2xl font-bold" data-testid="stat-top-performer">
                  {stats.topPerformer?.name || "N/A"}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Areas Covered
                </p>
                <p className="text-2xl font-bold" data-testid="stat-areas-covered">
                  {stats.areasCovered}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EmployeesTable
        employees={employees || []}
        isLoading={employeesLoading}
        onDelete={handleDeleteEmployee}
      />
    </div>
  );
}
