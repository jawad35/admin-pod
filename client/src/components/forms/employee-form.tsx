import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { insertEmployeeSchema } from "@shared/schema";
import { z } from "zod";

type EmployeeFormData = z.infer<typeof insertEmployeeSchema>;

interface EmployeeFormProps {
  onSuccess: () => void;
}

export default function EmployeeForm({ onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      age: 25,
      cnic: "",
      education: "",
      address: "",
      vehicleNo: "",
      assignedArea: "",
      salary: "30000",
      expenses: "0",
      totalSales: "0",
      shopsAssigned: 0,
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee created successfully",
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
        description: "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Ahmed Ali"
            data-testid="input-employee-name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            {...form.register("age", { valueAsNumber: true })}
            placeholder="25"
            data-testid="input-employee-age"
          />
          {form.formState.errors.age && (
            <p className="text-sm text-destructive">
              {form.formState.errors.age.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="cnic">CNIC</Label>
          <Input
            id="cnic"
            {...form.register("cnic")}
            placeholder="42101-1234567-8"
            data-testid="input-employee-cnic"
          />
          {form.formState.errors.cnic && (
            <p className="text-sm text-destructive">
              {form.formState.errors.cnic.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="education">Education</Label>
          <Input
            id="education"
            {...form.register("education")}
            placeholder="MBA Marketing"
            data-testid="input-employee-education"
          />
          {form.formState.errors.education && (
            <p className="text-sm text-destructive">
              {form.formState.errors.education.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="vehicleNo">Vehicle Number (optional)</Label>
          <Input
            id="vehicleNo"
            {...form.register("vehicleNo")}
            placeholder="KHI-1234"
            data-testid="input-vehicle-number"
          />
        </div>

        <div>
          <Label htmlFor="assignedArea">Assigned Area</Label>
          <Input
            id="assignedArea"
            {...form.register("assignedArea")}
            placeholder="North Karachi"
            data-testid="input-assigned-area"
          />
          {form.formState.errors.assignedArea && (
            <p className="text-sm text-destructive">
              {form.formState.errors.assignedArea.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="salary">Salary (PKR)</Label>
          <Input
            id="salary"
            type="number"
            step="0.01"
            {...form.register("salary")}
            placeholder="30000"
            data-testid="input-salary"
          />
          {form.formState.errors.salary && (
            <p className="text-sm text-destructive">
              {form.formState.errors.salary.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="shopsAssigned">Shops Assigned</Label>
          <Input
            id="shopsAssigned"
            type="number"
            {...form.register("shopsAssigned", { valueAsNumber: true })}
            placeholder="0"
            data-testid="input-shops-assigned"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...form.register("address")}
          placeholder="Gulshan-e-Iqbal, Block 2, Karachi"
          data-testid="textarea-address"
        />
        {form.formState.errors.address && (
          <p className="text-sm text-destructive">
            {form.formState.errors.address.message}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={createEmployeeMutation.isPending}
          data-testid="button-submit-employee"
        >
          {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
