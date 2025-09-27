import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import ExpenseForm from "@/components/forms/expense-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Plus, Receipt, TrendingUp, Calendar, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export default function Expenses() {
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

  const { data: expenses, isLoading: expensesLoading, error } = useQuery({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await apiRequest("DELETE", `/api/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
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
        description: "Failed to delete expense",
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

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(expenseId);
    }
  };

  // Calculate expense statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const stats = expenses ? {
    totalExpenses: expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0),
    monthlyExpenses: expenses
      .filter((exp: any) => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      })
      .reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0),
    expenseCount: expenses.length,
    topCategory: expenses.reduce((acc: any, exp: any) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount || 0);
      return acc;
    }, {}),
  } : {
    totalExpenses: 0,
    monthlyExpenses: 0,
    expenseCount: 0,
    topCategory: {},
  };

  const topCategoryName = Object.keys(stats.topCategory).reduce((a, b) => 
    stats.topCategory[a] > stats.topCategory[b] ? a : b, 'None'
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Rent': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Electricity': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Internet': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Maintenance': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Office Supplies': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (expensesLoading) {
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
        <h1 className="text-2xl font-bold" data-testid="text-expenses-title">
          Office Expenses
        </h1>
        <div className="flex space-x-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-expense">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <ExpenseForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expense Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold" data-testid="stat-total-expenses">
                  {formatCurrency(stats.totalExpenses)}
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
                  This Month
                </p>
                <p className="text-2xl font-bold" data-testid="stat-monthly-expenses">
                  {formatCurrency(stats.monthlyExpenses)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Records
                </p>
                <p className="text-2xl font-bold" data-testid="stat-expense-count">
                  {stats.expenseCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Top Category
                </p>
                <p className="text-2xl font-bold" data-testid="stat-top-category">
                  {topCategoryName}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Expense</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses && expenses.length > 0 ? (
                  expenses.map((expense: any) => (
                    <TableRow
                      key={expense.id}
                      className="hover:bg-muted/50"
                      data-testid={`expense-row-${expense.id}`}
                    >
                      <TableCell>
                        <p className="text-sm font-medium">{expense.title}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {formatCurrency(expense.amount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {formatDate(expense.date)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {expense.description || "No description"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-edit-${expense.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteExpense(expense.id)}
                            data-testid={`button-delete-${expense.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No expenses found</p>
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
