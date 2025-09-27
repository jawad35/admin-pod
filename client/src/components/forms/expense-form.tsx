import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { insertExpenseSchema } from "@shared/schema";
import { z } from "zod";

const expenseFormSchema = insertExpenseSchema.extend({
  date: z.string().min(1, "Date is required"),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  onSuccess: () => void;
}

const expenseCategories = [
  "Rent",
  "Electricity",
  "Internet",
  "Maintenance",
  "Office Supplies",
  "Transportation",
  "Marketing",
  "Software Licenses",
  "Insurance",
  "Other"
];

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { toast } = useToast();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: "",
      category: "",
      amount: "0",
      description: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const response = await apiRequest("POST", "/api/expenses", {
        ...data,
        date: new Date(data.date).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
      onSuccess();
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
        description: "Failed to create expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Expense Title</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Office Rent"
            data-testid="input-expense-title"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.watch("category")}
            onValueChange={(value) => form.setValue("category", value)}
          >
            <SelectTrigger data-testid="select-expense-category">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.category && (
            <p className="text-sm text-destructive">
              {form.formState.errors.category.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="amount">Amount (PKR)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...form.register("amount")}
            placeholder="50000"
            data-testid="input-expense-amount"
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-destructive">
              {form.formState.errors.amount.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            {...form.register("date")}
            data-testid="input-expense-date"
          />
          {form.formState.errors.date && (
            <p className="text-sm text-destructive">
              {form.formState.errors.date.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Additional details about the expense"
          data-testid="textarea-expense-description"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={createExpenseMutation.isPending}
          data-testid="button-submit-expense"
        >
          {createExpenseMutation.isPending ? "Creating..." : "Create Expense"}
        </Button>
      </div>
    </form>
  );
}
