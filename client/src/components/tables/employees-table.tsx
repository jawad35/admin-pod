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
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface Employee {
  id: string;
  name: string;
  age: number;
  cnic: string;
  education: string;
  address: string;
  vehicleNo?: string;
  assignedArea: string;
  salary: string;
  expenses: string;
  totalSales: string;
  shopsAssigned: number;
}

interface EmployeesTableProps {
  employees: Employee[];
  isLoading: boolean;
  onDelete: (employeeId: string) => void;
}

export default function EmployeesTable({ employees, isLoading, onDelete }: EmployeesTableProps) {
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

  const getPerformancePercentage = (sales: string, maxSales: number) => {
    if (maxSales === 0) return 0;
    return Math.min((parseFloat(sales) / maxSales) * 100, 100);
  };

  const maxSales = employees.length > 0 
    ? Math.max(...employees.map(emp => parseFloat(emp.totalSales || "0")))
    : 0;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Employee</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Assigned Area</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No employees found</p>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="hover:bg-muted/50"
                  data-testid={`employee-row-${employee.id}`}
                >
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-white">
                          {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium" data-testid={`employee-name-${employee.id}`}>
                          {employee.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Age: {employee.age}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.education}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{employee.cnic}</p>
                      <p className="text-sm text-muted-foreground">{employee.address}</p>
                      {employee.vehicleNo && (
                        <p className="text-sm text-muted-foreground">{employee.vehicleNo}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{employee.assignedArea}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.shopsAssigned} shops assigned
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">
                      {formatCurrency(employee.salary)}
                    </p>
                    <p className="text-sm text-muted-foreground">Per month</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(employee.totalSales)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total sales</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${getPerformancePercentage(employee.totalSales, maxSales)}%`
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-view-${employee.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-edit-${employee.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(employee.id)}
                        data-testid={`button-delete-${employee.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
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
