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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { insertShopSchema } from "@shared/schema";
import { z } from "zod";

const shopFormSchema = insertShopSchema.extend({
  expiryDate: z.string().min(1, "Expiry date is required"),
});

type ShopFormData = z.infer<typeof shopFormSchema>;

interface ShopFormProps {
  onSuccess: () => void;
}

export default function ShopForm({ onSuccess }: ShopFormProps) {
  const { toast } = useToast();

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      shopId: "",
      name: "",
      owner: "",
      email: "",
      password: "",
      type: "retailer",
      city: "",
      location: "",
      imageUrl: "",
      subscriptionStatus: "active",
      monthlyFee: "15000",
      discount: "0",
      permanentLicense: false,
      expiryDate: "",
      storageUsed: "0",
      storageLimit: "1000",
      totalRevenue: "0",
    },
  });

  const createShopMutation = useMutation({
    mutationFn: async (data: ShopFormData) => {
      const response = await apiRequest("POST", "/api/shops", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Shop created successfully",
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
        description: "Failed to create shop",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShopFormData) => {
    createShopMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="shopId">Shop ID</Label>
          <Input
            id="shopId"
            {...form.register("shopId")}
            placeholder="SH001"
            data-testid="input-shop-id"
          />
          {form.formState.errors.shopId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.shopId.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="name">Shop Name</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Golden Touch Salon"
            data-testid="input-shop-name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="owner">Owner Name</Label>
          <Input
            id="owner"
            {...form.register("owner")}
            placeholder="Sarah Ahmed"
            data-testid="input-owner-name"
          />
          {form.formState.errors.owner && (
            <p className="text-sm text-destructive">
              {form.formState.errors.owner.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="sarah@goldentouchsalon.com"
            data-testid="input-email"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...form.register("password")}
            placeholder="Password for shop login"
            data-testid="input-password"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Shop Type</Label>
          <Select
            value={form.watch("type")}
            onValueChange={(value) => form.setValue("type", value as "retailer" | "salon")}
          >
            <SelectTrigger data-testid="select-shop-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retailer">Retailer</SelectItem>
              <SelectItem value="salon">Salon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Select
            value={form.watch("city")}
            onValueChange={(value) => form.setValue("city", value)}
          >
            <SelectTrigger data-testid="select-city">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Karachi">Karachi</SelectItem>
              <SelectItem value="Lahore">Lahore</SelectItem>
              <SelectItem value="Islamabad">Islamabad</SelectItem>
              <SelectItem value="Peshawar">Peshawar</SelectItem>
              <SelectItem value="Quetta">Quetta</SelectItem>
              <SelectItem value="Faisalabad">Faisalabad</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="monthlyFee">Monthly Fee (PKR)</Label>
          <Input
            id="monthlyFee"
            type="number"
            {...form.register("monthlyFee")}
            placeholder="15000"
            data-testid="input-monthly-fee"
          />
        </div>

        <div>
          <Label htmlFor="discount">Discount (%)</Label>
          <Input
            id="discount"
            type="number"
            {...form.register("discount")}
            placeholder="0"
            data-testid="input-discount"
          />
        </div>

        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            {...form.register("expiryDate")}
            data-testid="input-expiry-date"
          />
          {form.formState.errors.expiryDate && (
            <p className="text-sm text-destructive">
              {form.formState.errors.expiryDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="imageUrl">Image URL (optional)</Label>
          <Input
            id="imageUrl"
            {...form.register("imageUrl")}
            placeholder="https://example.com/shop-image.jpg"
            data-testid="input-image-url"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location/Address</Label>
        <Textarea
          id="location"
          {...form.register("location")}
          placeholder="Gulshan-e-Iqbal, Block 2, Karachi"
          data-testid="textarea-location"
        />
        {form.formState.errors.location && (
          <p className="text-sm text-destructive">
            {form.formState.errors.location.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="permanentLicense"
          checked={form.watch("permanentLicense")}
          onCheckedChange={(checked) => form.setValue("permanentLicense", checked)}
          data-testid="switch-permanent-license"
        />
        <Label htmlFor="permanentLicense">Permanent License</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={createShopMutation.isPending}
          data-testid="button-submit-shop"
        >
          {createShopMutation.isPending ? "Creating..." : "Create Shop"}
        </Button>
      </div>
    </form>
  );
}
