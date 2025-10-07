import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Loader2, UserPlus, Building, Shield, MapPin, FileText, Save } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";



export default function ShopUserRegistration() {
    const { toast } = useToast();
    const [match, params] = useRoute("/create-shop-user/:id"); // example route pattern
    const id = params?.id;
    console.log(id)
    // Get navigation function (similar to useNavigate)
    const [, navigate] = useLocation();
    const isEditMode = Boolean(id);

    // Fetch user data if in edit mode
    const { data: userData, isLoading: userLoading } = useQuery({
        queryKey: [`/api/users/${id}`],
        enabled: isEditMode,
    });

    const { data: shops } = useQuery({ queryKey: ["/api/shops"] });
    const { data: subscriptionPlans } = useQuery({ queryKey: ["/api/subscription-plans"] });
    const registerSchema = z.object({
        email: z.string().email("Invalid email address"),
        password: isEditMode
            ? z.string().min(1).optional().or(z.literal(''))
            : z.string().min(6, "Password must be at least 6 characters"),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        role: z.enum(["super_admin", "admin", "cashier", "user"]),
        shopId: z.string().optional(),
        mobileNo: z.string().min(1, "Mobile number is required"),
        address: z.string().min(1, "Address is required"),
        agreeTerms: z.boolean().refine((val) => val === true, "You must agree to terms and policies"),
        signedAgreementUrl: z.string().optional(),
        isPermanent: z.boolean().default(false),
        planId: z.string().optional(),
        referrerId: z.string().optional(),
        isActive: z.boolean().default(true),
    });

    type RegisterFormData = z.infer<typeof registerSchema>;
    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: "user",
            agreeTerms: false,
            isPermanent: false,
            isActive: true,
            password: "", // Empty password for edit mode
        },
    });

    // Set form values when user data is loaded (edit mode)
    // Set form values when user data is loaded (edit mode)
    useEffect(() => {
        if (userData && isEditMode) {
            form.reset({
                email: userData.email,
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                role: userData.role,
                shopId: userData.shopId || "",
                planId: userData.planId || "", // Fix this line
                mobileNo: userData.mobileNo || "",
                address: userData.address || "",
                agreeTerms: userData.agreeTerms || false,
                signedAgreementUrl: userData.signedAgreementUrl || "",
                isPermanent: userData.isPermanent || false,
                isActive: userData.isActive ?? true,
                // Don't set password in edit mode
                password: "",
            });
        }
    }, [userData, isEditMode, form]);

    // Create user mutation
    const createUserMutation = useMutation({
        mutationFn: async (data: RegisterFormData) => {
            return await apiRequest("POST", "/api/register-shop-users", {
                ...data,
                shopId: data.shopId || undefined,
                planId: data.planId || undefined,
                referrerId: data.referrerId || undefined,
            });
        },
        onSuccess: () => {
            toast({
                title: "🎉 Success!",
                description: "User created successfully.",
                className: "bg-green-50 border-green-200"
            });
            form.reset();
            navigate("/shop-users");
        },
        onError: (err: Error) => {
            toast({
                title: "❌ Creation Failed",
                description: err.message,
                variant: "destructive"
            });
        },
    });

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: async (data: RegisterFormData) => {
            return await apiRequest("PUT", `/api/users/${id}`, {
                ...data,
                // Don't send password if it's empty (not changing)
                ...(data.password ? {} : { password: undefined }),
                shopId: data.shopId || undefined,
                planId: data.planId || undefined,
                referrerId: data.referrerId || undefined,
            });
        },
        onSuccess: () => {
            toast({
                title: "✅ Updated!",
                description: "User updated successfully.",
                className: "bg-green-50 border-green-200"
            });
            navigate("/shop-users");
        },
        onError: (err: Error) => {
            toast({
                title: "❌ Update Failed",
                description: err.message,
                variant: "destructive"
            });
        },
    });

    const onSubmit = (data: RegisterFormData) => {
        if (isEditMode) {
            updateUserMutation.mutate(data);
        } else {
            createUserMutation.mutate(data);
        }
    };

    const isLoading = userLoading;
    const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;

    if (isLoading && isEditMode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {isEditMode ? "Edit User" : "Shop User Registration"}
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {isEditMode
                            ? "Update user information and settings."
                            : "Create a new user account with specific roles and shop assignments."
                        }
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="shadow-xl border-0 rounded-3xl overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1">
                            <CardHeader className="bg-white pb-4">
                                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <UserPlus className="w-6 h-6 text-blue-600" />
                                    {isEditMode ? "Edit User Information" : "User Information"}
                                </CardTitle>
                            </CardHeader>
                        </div>

                        <CardContent className="p-6 sm:p-8">
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                {/* Personal Information Section */}
                                <Section title="Personal Information" icon={<UserPlus className="w-5 h-5" />}>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <FormField
                                            label="First Name"
                                            name="firstName"
                                            register={form.register}
                                            placeholder="John"
                                            error={form.formState.errors.firstName}
                                        />
                                        <FormField
                                            label="Last Name"
                                            name="lastName"
                                            register={form.register}
                                            placeholder="Doe"
                                            error={form.formState.errors.lastName}
                                        />
                                        <FormField
                                            label="Email Address"
                                            name="email"
                                            register={form.register}
                                            type="email"
                                            placeholder="john@example.com"
                                            error={form.formState.errors.email}
                                            disabled={isEditMode} // Email cannot be changed in edit mode
                                        />
                                        <FormField
                                            label="Mobile Number"
                                            name="mobileNo"
                                            register={form.register}
                                            placeholder="+1234567890"
                                            error={form.formState.errors.mobileNo}
                                        />
                                        <FormField
                                            label="Password"
                                            name="password"
                                            register={form.register}
                                            type="password"
                                            placeholder={isEditMode ? "Leave blank to keep current" : "••••••"}
                                            error={form.formState.errors.password}
                                        />
                                    </div>
                                </Section>

                                {/* Shop & Role Section */}
                                <Section title="Shop & Role Assignment" icon={<Building className="w-5 h-5" />}>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                Role *
                                            </Label>
                                            <Select
                                                value={form.watch("role")}
                                                onValueChange={(v) => form.setValue("role", v)}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user" className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                                        User
                                                    </SelectItem>
                                                    <SelectItem value="cashier" className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                        Cashier
                                                    </SelectItem>
                                                    <SelectItem value="admin" className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                                        Admin
                                                    </SelectItem>
                                                    <SelectItem value="super_admin" className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                                        Super Admin
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Shop (Optional)</Label>
                                            <Select
                                                value={form.watch("shopId")}
                                                onValueChange={(v) => form.setValue("shopId", v)}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Select shop" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {shops?.map((shop: any) => (
                                                        <SelectItem key={shop.id} value={shop.id}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{shop.name}</span>
                                                                <span className="text-xs text-gray-500">{shop.shopId}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Subscription Plan</Label>
                                            <Select
                                                value={form.watch("planId")}
                                                onValueChange={(v) => form.setValue("planId", v)}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Select plan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {subscriptionPlans?.map((plan: any) => (
                                                        <SelectItem key={plan.id} value={plan.id}>
                                                            <div className="flex justify-between items-center w-full">
                                                                <span>{plan.name}</span>
                                                                <span className="text-sm font-semibold text-blue-600">
                                                                    ${plan.price}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </Section>

                                {/* Address Section */}
                                <Section title="Contact Details" icon={<MapPin className="w-5 h-5" />}>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Address *</Label>
                                        <Textarea
                                            {...form.register("address")}
                                            placeholder="Enter your complete address..."
                                            rows={3}
                                            className="resize-none"
                                        />
                                        {form.formState.errors.address && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {form.formState.errors.address.message}
                                            </p>
                                        )}
                                    </div>
                                </Section>

                                {/* Agreement Section */}
                                <Section title="Agreements & Settings" icon={<FileText className="w-5 h-5" />}>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                                <Checkbox
                                                    id="agreeTerms"
                                                    checked={form.watch("agreeTerms")}
                                                    onCheckedChange={(c) => form.setValue("agreeTerms", c as boolean)}
                                                    className="mt-1"
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor="agreeTerms" className="text-sm font-medium">
                                                        I agree to the terms and policies *
                                                    </Label>
                                                    <p className="text-xs text-gray-500">
                                                        You must agree to our terms of service and privacy policy
                                                    </p>
                                                    {form.formState.errors.agreeTerms && (
                                                        <p className="text-sm text-red-500">
                                                            {form.formState.errors.agreeTerms.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium">Permanent User</Label>
                                                    <p className="text-xs text-gray-500">
                                                        User account will not expire automatically
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={form.watch("isPermanent")}
                                                    onCheckedChange={(c) => form.setValue("isPermanent", c)}
                                                />
                                            </div>

                                            {isEditMode && (
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                    <div className="space-y-1">
                                                        <Label className="text-sm font-medium">Active User</Label>
                                                        <p className="text-xs text-gray-500">
                                                            User account is active and can login
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={form.watch("isActive")}
                                                        onCheckedChange={(c) => form.setValue("isActive", c)}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <FormField
                                                label="Signed Agreement URL"
                                                name="signedAgreementUrl"
                                                register={form.register}
                                                placeholder="https://example.com/agreement.pdf"
                                            />
                                            <FormField
                                                label="Referrer ID"
                                                name="referrerId"
                                                register={form.register}
                                                placeholder="123"
                                            />
                                        </div>
                                    </div>
                                </Section>

                                {/* Submit Button */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex gap-4"
                                >
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/shop-users")}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                                        size="lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {isEditMode ? "Updating..." : "Creating..."}
                                            </>
                                        ) : (
                                            <>
                                                {isEditMode ? <Save className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                                {isEditMode ? "Update User" : "Register User"}
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

/** Section Component */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <motion.section
            className="space-y-4 p-6 bg-gray-50/50 rounded-2xl border"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="text-blue-600">
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            {children}
        </motion.section>
    );
}

/** Reusable Form Field Component */
function FormField({
    label,
    name,
    register,
    placeholder,
    type = "text",
    error,
    disabled = false,
}: {
    label: string;
    name: keyof RegisterFormData;
    register: any;
    placeholder?: string;
    type?: string;
    error?: any;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="text-sm font-medium">
                {label}
            </Label>
            <Input
                id={name}
                type={type}
                placeholder={placeholder}
                {...register(name)}
                disabled={disabled}
                className={`h-11 ${error ? "border-red-500 focus:border-red-500" : ""} ${disabled ? "bg-gray-100" : ""}`}
            />
            {error && (
                <p className="text-sm text-red-500 mt-1">
                    {error.message}
                </p>
            )}
        </div>
    );
}