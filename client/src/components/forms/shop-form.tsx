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
import { useEffect } from "react";

// Updated schema without email/password, adding referral
export const shopFormSchema = insertShopSchema
  .extend({
    expiryDate: z.preprocess(
      (val) => (typeof val === "string" ? new Date(val) : val),
      z.date().nullable()
    ),
    referral: z.string().optional(),
  })
  .omit({
    email: true,
    password: true,
  });

type ShopFormData = z.infer<typeof shopFormSchema>;

interface Shop {
  id: string;
  shopId: string;
  name: string;
  owner: string;
  email: string;
  type: string;
  city: string;
  location: string;
  subscriptionStatus: string;
  monthlyFee: string;
  discount: string;
  expiryDate: string;
  totalRevenue: string;
  imageUrl?: string;
  permanentLicense?: boolean;
  storageUsed?: string;
  storageLimit?: string;
  referral?: string;
}

interface ShopFormProps {
  shop?: Shop; // Optional shop for editing
  onSuccess: () => void;
}

export default function ShopForm({ shop, onSuccess }: ShopFormProps) {
  const { toast } = useToast();
  const isEditing = Boolean(shop);

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      shopId: "",
      name: "",
      owner: "",
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
      referral: "",
    },
  });

  // Reset form when shop changes (for editing)
  useEffect(() => {
    if (shop) {
      // Format the expiry date for the date input
      const expiryDate = shop.expiryDate ? new Date(shop.expiryDate).toISOString().split('T')[0] : "";

      form.reset({
        shopId: shop.shopId || "",
        name: shop.name || "",
        owner: shop.owner || "",
        type: (shop.type as "retailer" | "salon") || "retailer",
        city: shop.city || "",
        location: shop.location || "",
        imageUrl: shop.imageUrl || "",
        subscriptionStatus: (shop.subscriptionStatus as "active" | "expired" | "suspended") || "active",
        monthlyFee: shop.monthlyFee?.toString() || "15000",
        discount: shop.discount?.toString() || "0",
        permanentLicense: shop.permanentLicense || false,
        expiryDate: expiryDate,
        storageUsed: shop.storageUsed?.toString() || "0",
        storageLimit: shop.storageLimit?.toString() || "1000",
        totalRevenue: shop.totalRevenue?.toString() || "0",
        referral: shop.referral || "",
      });
    } else {
      // Reset to default values for new shop
      form.reset({
        shopId: "",
        name: "",
        owner: "",
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
        referral: "",
      });
    }
  }, [shop, form]);
  const transformShopDataForAPI = (data: ShopFormData) => {
    const transformed = { ...data } as any;

    // Convert numeric fields to strings (as expected by decimal fields in schema)
    transformed.monthlyFee = data.monthlyFee.toString();
    transformed.discount = data.discount.toString();
    transformed.storageUsed = data.storageUsed.toString();
    transformed.storageLimit = data.storageLimit.toString();
    transformed.totalRevenue = data.totalRevenue.toString();

    // Convert expiryDate string to Date object
    if (data.expiryDate) {
      const date = new Date(data.expiryDate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      transformed.expiryDate = date; // Send as Date object, not string
    } else {
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 1);
      transformed.expiryDate = defaultDate;
    }

    console.log('Transformed data for API:', transformed);
    return transformed;
  };

  const createShopMutation = useMutation({
    mutationFn: async (data: ShopFormData) => {
      console.log("Form data:", data);

      const transformedData = transformShopDataForAPI(data);
      console.log("Transformed data:", transformedData);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create shop";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Created shop:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Shop created successfully:", data);

      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      toast({
        title: "Success! 🎉",
        description: `Shop "${data.name || data.shopId}" created successfully`,
      });

      onSuccess();
    },
    onError: (error) => {
      console.error("Error creating shop:", error);

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
        description: error.message || "Failed to create shop",
        variant: "destructive",
      });
    },
  });

  const updateShopMutation = useMutation({
    mutationFn: async (data: ShopFormData) => {
      if (!shop) throw new Error("No shop provided for update");

      console.log("Form data for update:", data);

      const transformedData = transformShopDataForAPI(data);
      console.log("Transformed data for update:", transformedData);

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...transformedData,
          shopId: shop.shopId, // Use the original shopId, don't allow changing it
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update shop";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Update error details:", errorData);
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Updated shop:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Shop updated successfully:", data);

      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      toast({
        title: "Success! 🎉",
        description: `Shop "${data.name || data.shopId}" updated successfully`,
      });

      onSuccess();
    },
    onError: (error) => {
      console.error("Error updating shop:", error);

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
        description: error.message || "Failed to update shop",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShopFormData) => {
    if (isEditing) {
      updateShopMutation.mutate(data);
    } else {
      createShopMutation.mutate(data);
    }
  };

  const isLoading = createShopMutation.isPending || updateShopMutation.isPending;

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
            disabled={isEditing} // Disable shop ID when editing
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
          <Label htmlFor="referral">Referral (Optional)</Label>
          <Input
            id="referral"
            {...form.register("referral")}
            placeholder="Referred by John Doe"
            data-testid="input-referral"
          />
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

        <div>
          <Label htmlFor="subscriptionStatus">Subscription Status</Label>
          <Select
            value={form.watch("subscriptionStatus")}
            onValueChange={(value) => form.setValue("subscriptionStatus", value as "active" | "expired" | "suspended")}
          >
            <SelectTrigger data-testid="select-subscription-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
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
          disabled={isLoading}
          data-testid="button-submit-shop"
        >
          {isLoading
            ? (isEditing ? "Updating..." : "Creating...")
            : (isEditing ? "Update Shop" : "Create Shop")
          }
        </Button>
      </div>
    </form>
  );
}