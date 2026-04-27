// components/forms/shop-form.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { insertShopSchema } from "@shared/schema";
import { z } from "zod";
import { useEffect, useState } from "react";

// Updated schema without email/password, adding referral and subscriptionPlanId
export const shopFormSchema = insertShopSchema
  .extend({
    expiryDate: z.preprocess(
      (val) => (typeof val === "string" ? new Date(val) : val),
      z.date().nullable()
    ),
    referral: z.string().optional(),
    subscriptionPlanId: z.string().optional(),
    phoneNo: z.string().optional(),
    termsPoliciesAccepted: z.boolean().default(false),
  })
  .omit({
    email: true,
    password: true,
  });

type ShopFormData = z.infer<typeof shopFormSchema>;

interface SubscriptionPlan {
  id: string;
  name: string;
  planType: string;
  price: string;
  duration: number;
}

interface Shop {
  id: string;
  shopId: string;
  name: string;
  owner: string;
  email: string;
  phoneNo?: string;
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
  subscriptionPlanId?: string;
  termsPoliciesAccepted?: boolean;
}

interface ShopFormProps {
  shop?: Shop;
  onSuccess: () => void;
}

export default function ShopForm({ shop, onSuccess }: ShopFormProps) {
  const { toast } = useToast();
  const isEditing = Boolean(shop);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<string>("0");

  // Fetch subscription plans
  const { data: subscriptionPlans, isLoading: plansLoading, isSuccess } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      console.log("1. Starting fetch...");
      try {
        const data = await apiRequest("GET", "/api/subscription-plans");
        console.log("2. Data received:", data);
        
        if (Array.isArray(data)) {
          console.log("3. Returning array with length:", data.length);
          return data;
        }
        if (data && data.data && Array.isArray(data.data)) {
          console.log("3. Returning data.data with length:", data.data.length);
          return data.data;
        }
        
        console.log("3. Returning empty array");
        return [];
      } catch (err) {
        console.error("Error fetching plans:", err);
        throw err;
      }
    },
  });

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      shopId: "",
      name: "",
      owner: "",
      phoneNo: "",
      type: "retailer",
      city: "",
      location: "",
      imageUrl: "",
      subscriptionStatus: "active",
      discount: "0",
      permanentLicense: false,
      expiryDate: "",
      storageUsed: "0",
      storageLimit: "1000",
      totalRevenue: "0",
      referral: "",
      subscriptionPlanId: null,
      termsPoliciesAccepted: false,
    },
  });

  // Watch for subscription plan changes
  const watchSubscriptionPlanId = form.watch("subscriptionPlanId");

  // Update price when plan changes
  useEffect(() => {
    if (watchSubscriptionPlanId && subscriptionPlans) {
      const selectedPlan = subscriptionPlans.find(
        (plan: SubscriptionPlan) => plan.id === watchSubscriptionPlanId
      );
      if (selectedPlan) {
        setSelectedPlanPrice(selectedPlan.price);
      }
    } else {
      setSelectedPlanPrice("0");
    }
  }, [watchSubscriptionPlanId, subscriptionPlans]);

  // Reset form when shop changes (for editing)
  useEffect(() => {
    if (shop) {
      const expiryDate = shop.expiryDate ? new Date(shop.expiryDate).toISOString().split('T')[0] : "";

      form.reset({
        shopId: shop.shopId || "",
        name: shop.name || "",
        owner: shop.owner || "",
        phoneNo: shop.phoneNo || "",
        type: (shop.type as "retailer" | "salon") || "retailer",
        city: shop.city || "",
        location: shop.location || "",
        imageUrl: shop.imageUrl || "",
        subscriptionStatus: (shop.subscriptionStatus as "active" | "expired" | "suspended") || "active",
        discount: shop.discount?.toString() || "0",
        permanentLicense: shop.permanentLicense || false,
        expiryDate: expiryDate,
        storageUsed: shop.storageUsed?.toString() || "0",
        storageLimit: shop.storageLimit?.toString() || "1000",
        totalRevenue: shop.totalRevenue?.toString() || "0",
        referral: shop.referral || "",
        subscriptionPlanId: shop.subscriptionPlanId || "",
        termsPoliciesAccepted: shop.termsPoliciesAccepted || false,
      });
    } else {
      form.reset({
        shopId: "23232",
        name: "",
        owner: "",
        phoneNo: "",
        type: "retailer",
        city: "",
        location: "",
        imageUrl: "",
        subscriptionStatus: "active",
        discount: "0",
        permanentLicense: false,
        expiryDate: "",
        storageUsed: "0",
        storageLimit: "1000",
        totalRevenue: "0",
        referral: "",
        subscriptionPlanId: "",
        termsPoliciesAccepted: false,
      });
    }
  }, [shop, form]);

  useEffect(() => {
    console.log("subscriptionPlans changed:", subscriptionPlans);
    if (subscriptionPlans && subscriptionPlans.length > 0) {
      console.log("First plan:", subscriptionPlans[0]);
    }
  }, [subscriptionPlans]);

  const transformShopDataForAPI = (data: ShopFormData) => {
    const transformed = { ...data } as any;

    // Use selected plan price as monthly fee
    if (data.subscriptionPlanId && selectedPlanPrice !== "0") {
      transformed.monthlyFee = selectedPlanPrice;
    } else {
      transformed.monthlyFee = data.monthlyFee || "0";
    }

    // Handle subscriptionPlanId - set to null if empty string
    transformed.subscriptionPlanId = data.subscriptionPlanId && data.subscriptionPlanId !== ""
      ? data.subscriptionPlanId
      : null;

    transformed.discount = data.discount.toString();
    transformed.storageUsed = data.storageUsed.toString();
    transformed.storageLimit = data.storageLimit.toString();
    transformed.totalRevenue = data.totalRevenue.toString();

    if (data.expiryDate) {
      const date = new Date(data.expiryDate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      transformed.expiryDate = date;
    } else {
      // Calculate expiry date based on subscription plan duration
      if (data.subscriptionPlanId && subscriptionPlans) {
        const selectedPlan = subscriptionPlans.find(
          (plan: SubscriptionPlan) => plan.id === data.subscriptionPlanId
        );
        if (selectedPlan) {
          const defaultDate = new Date();
          defaultDate.setMonth(defaultDate.getMonth() + selectedPlan.duration);
          transformed.expiryDate = defaultDate;
        } else {
          const defaultDate = new Date();
          defaultDate.setFullYear(defaultDate.getFullYear() + 1);
          transformed.expiryDate = defaultDate;
        }
      } else {
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        transformed.expiryDate = defaultDate;
      }
    }

    return transformed;
  };

  const createShopMutation = useMutation({
    mutationFn: async (data: ShopFormData) => {
      // Validate terms acceptance for new shops
      if (!data.termsPoliciesAccepted) {
        throw new Error("You must accept the Terms & Policies to create a shop");
      }
      const transformedData = transformShopDataForAPI(data);
      const response = await apiRequest("POST", "/api/shops", transformedData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success! 🎉",
        description: `Shop "${data.name || data.shopId}" created successfully`,
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
        description: error.message || "Failed to create shop",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    console.log("subscriptionPlans state:", subscriptionPlans);
    console.log("plansLoading:", plansLoading);
    console.log("isSuccess:", isSuccess);
  }, [subscriptionPlans, plansLoading, isSuccess]);

  const updateShopMutation = useMutation({
    mutationFn: async (data: ShopFormData) => {
      if (!shop) throw new Error("No shop provided for update");
      const transformedData = transformShopDataForAPI(data);
      const response = await apiRequest("PUT", `/api/shops/${shop.id}`, {
        ...transformedData,
        shopId: shop.shopId,
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success! 🎉",
        description: `Shop updated successfully`,
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
        description: error.message || "Failed to update shop",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShopFormData) => {
    // Ensure subscriptionPlanId is null if empty
    const cleanedData = {
      ...data,
      subscriptionPlanId: data.subscriptionPlanId && data.subscriptionPlanId !== ""
        ? data.subscriptionPlanId
        : null
    };

    if (isEditing) {
      updateShopMutation.mutate(cleanedData);
    } else {
      createShopMutation.mutate(cleanedData);
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
            placeholder="Auto-generated"
            data-testid="input-shop-id"
            disabled={isEditing}
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
          <Label htmlFor="phoneNo">Phone Number</Label>
          <Input
            id="phoneNo"
            {...form.register("phoneNo")}
            placeholder="+92 300 1234567"
            data-testid="input-phone-no"
          />
          {form.formState.errors.phoneNo && (
            <p className="text-sm text-destructive">
              {form.formState.errors.phoneNo.message}
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
          <Label htmlFor="subscriptionPlanId">Subscription Plan (Optional)</Label>
          {plansLoading ? (
            <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
              Loading plans...
            </div>
          ) : isSuccess ? (
            <Select
              value={form.watch("subscriptionPlanId") || "none"}
              onValueChange={(value) => form.setValue("subscriptionPlanId", value === "none" ? null : value)}
            >
              <SelectTrigger data-testid="select-subscription-plan">
                <SelectValue placeholder="Select a plan (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No plan selected</SelectItem>
                {subscriptionPlans && subscriptionPlans.length > 0 ? (
                  subscriptionPlans.map((plan: SubscriptionPlan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.planType} - PKR {plan.price}/month
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-plans" disabled>
                    No plans available - Create a plan first
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
              Failed to load plans. Please refresh the page.
            </div>
          )}
          {selectedPlanPrice !== "0" && selectedPlanPrice !== "0.00" && (
            <p className="text-sm text-green-600 mt-1">
              Monthly Fee: PKR {selectedPlanPrice}
            </p>
          )}
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

      {/* Terms & Policies Acceptance */}
      <div className="flex items-start space-x-3 border-t pt-4">
        <Checkbox
          id="termsPoliciesAccepted"
          checked={form.watch("termsPoliciesAccepted")}
          onCheckedChange={(checked) => form.setValue("termsPoliciesAccepted", checked as boolean)}
          data-testid="checkbox-terms-accepted"
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="termsPoliciesAccepted" className="font-semibold">
            I accept the Terms & Policies {!isEditing && "*"}
          </Label>
          <p className="text-sm text-muted-foreground">
            By accepting, you agree to our terms of service, privacy policy, and data handling practices.
          </p>
        </div>
      </div>
      {!isEditing && !form.watch("termsPoliciesAccepted") && form.formState.isSubmitted && (
        <p className="text-sm text-destructive">
          You must accept the Terms & Policies to create a shop
        </p>
      )}

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