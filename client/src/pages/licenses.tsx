import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Key, Copy, CheckCircle, AlertCircle, Loader2, Filter, 
  History, Shield, RefreshCw, Trash2, AlertTriangle, Computer, 
  Calendar, Clock, Hash, User, Building2, MapPin, XCircle,
  Wifi
} from "lucide-react";

interface Shop {
  id: string;
  shopId: string;
  name: string;
  owner: string;
  type: string;
  city: string;
  subscriptionStatus: string;
  permanentLicense: boolean;
  expiryDate?: string;
}

interface License {
  id: string;
  license_key: string;
  admin_pin: string;
  shop_id: string;
  hardware_id: string | null;
  computer_name: string | null;  // Add this
  mac_address: string | null;     // Add this
  os_platform: string | null;     // Add this
  os_release: string | null;      // Add this
  cpu_model: string | null;       // Add this
  manufacturer: string | null;    // Add this
  model: string | null;           // Add this
  plan_type: string;
  duration_days: number | null;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function LicenseManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [planType, setPlanType] = useState("monthly");
  const [durationDays, setDurationDays] = useState(30);
  const [customPin, setCustomPin] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all shops
  const { data: shops = [], isLoading: shopsLoading, refetch: refetchShops } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/shops", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch shops");
      return res.json();
    },
  });

  // Fetch licenses for selected shop with auto-expiration check
  const { data: licenses = [], refetch: refetchLicenses, isLoading: licensesLoading } = useQuery<License[]>({
    queryKey: ["licenses", selectedShop?.id],
    queryFn: async () => {
      if (!selectedShop) return [];
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/licenses/shop/${selectedShop.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch licenses");
      const data = await res.json();

      const now = new Date();
      let updated = false;
      
      // Update status for expired licenses
      const updatedLicenses = data.map((license: License) => {
        if (license.expires_at && new Date(license.expires_at) < now && license.status === 'active') {
          updated = true;
          return { ...license, status: 'expired' };
        }
        return license;
      });
      
      // If any licenses were updated, refresh to get latest from server
      if (updated) {
        setTimeout(() => refetchLicenses(), 100);
      }
      
      return updatedLicenses;
    },
    enabled: !!selectedShop,
    refetchInterval: 10000, // Check every 10 seconds for expiration
  });

  // Fetch shop subscription status with license info
  const { data: shopStatus, refetch: refetchShopStatus } = useQuery({
    queryKey: ["shop-status", selectedShop?.id],
    queryFn: async () => {
      if (!selectedShop) return null;
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/shops/${selectedShop.id}/subscription-status-with-license`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch shop status");
      return res.json();
    },
    enabled: !!selectedShop,
  });

  // Filter licenses based on active tab
  const getFilteredLicenses = () => {
    switch (activeTab) {
      case "active":
        return licenses.filter(l => l.status === 'active');
      case "expired":
        return licenses.filter(l => l.status === 'expired');
      case "all":
      default:
        return licenses;
    }
  };

  const filteredLicenses = getFilteredLicenses();
  const hasActiveLicense = licenses.some(l => l.status === 'active');

  // Generate license mutation
  const generateLicenseMutation = useMutation({
    mutationFn: async (data: { shopId: string; planType: string; durationDays: number | null; durationMinutes: number | null; adminPin: string }) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/generate-license-with-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const response = await res.json();
      if (!res.ok) {
        throw new Error(response.message || "Failed to generate license");
      }
      return response;
    },
    onSuccess: (data) => {
      setGeneratedKey(data.license.license_key);
      setGeneratedPin(data.admin_pin);
      toast({
        title: "License & PIN Generated",
        description: `License key and admin PIN created successfully. License will expire on ${data.license.expires_at ? new Date(data.license.expires_at).toLocaleString() : 'Never'}`,
      });
      refetchLicenses();
      refetchShopStatus();
      setCustomPin("");
    },
    onError: (error: Error) => {
      if (error.message.includes("already has an active license")) {
        setErrorDialog({
          title: "Active License Exists",
          message: "This shop already has an active license. Please either:\n1. Delete the current active license, or\n2. Wait for it to expire naturally\n\nCannot create a new license while an active one exists."
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Delete license mutation
  const deleteLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/licenses/${licenseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete license");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "License Deleted",
        description: "License has been successfully deleted",
      });
      refetchLicenses();
      refetchShopStatus();
      setDeleteDialogOpen(false);
      setLicenseToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change PIN mutation
  const changePinMutation = useMutation({
    mutationFn: async (data: { licenseKey: string; oldPin: string; newPin: string }) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin-pin/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to change PIN");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "PIN Changed",
        description: "Admin PIN has been updated successfully",
      });
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setIsChangePinModalOpen(false);
      refetchLicenses();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredShops = shops.filter(
    (shop) =>
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.shopId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateLicense = () => {
    if (!selectedShop) {
      toast({
        title: "Error",
        description: "Please select a shop first",
        variant: "destructive",
      });
      return;
    }

    // Check if shop already has an active license (double-check)
    if (hasActiveLicense) {
      setErrorDialog({
        title: "Active License Exists",
        message: `Shop "${selectedShop.name}" already has an active license.\n\nPlease delete the current active license or wait for it to expire before generating a new one.\n\nEach shop can only have ONE active license at a time.`
      });
      return;
    }

    if (!customPin || customPin.length < 4) {
      toast({
        title: "Error",
        description: "Please enter an admin PIN (minimum 4 digits)",
        variant: "destructive",
      });
      return;
    }

    let actualDurationDays = null;
    let durationMinutes = null;

    if (planType === "test") {
      durationMinutes = 2;
    } else if (planType === "5min") {
      durationMinutes = 5;
    } else if (planType === "monthly") {
      actualDurationDays = 30;
    } else if (planType === "quarterly") {
      actualDurationDays = 90;
    } else if (planType === "yearly") {
      actualDurationDays = 365;
    } else if (planType === "lifetime") {
      actualDurationDays = null;
    }

    generateLicenseMutation.mutate({
      shopId: selectedShop.id,
      planType,
      durationDays: actualDurationDays,
      durationMinutes: durationMinutes,
      adminPin: customPin,
    });
  };

  const handleChangePin = () => {
    if (!oldPin || !newPin || !confirmPin) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: "Error",
        description: "New PINs do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPin.length < 4) {
      toast({
        title: "Error",
        description: "PIN must be at least 4 digits",
        variant: "destructive",
      });
      return;
    }

    const activeLicense = licenses.find(l => l.status === 'active');
    if (!activeLicense) {
      toast({
        title: "Error",
        description: "No active license found for this shop",
        variant: "destructive",
      });
      return;
    }

    changePinMutation.mutate({
      licenseKey: activeLicense.license_key,
      oldPin,
      newPin,
    });
  };

  const handleDeleteLicense = () => {
    if (licenseToDelete) {
      deleteLicenseMutation.mutate(licenseToDelete.id);
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'pin') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
    toast({
      title: "Copied!",
      description: `${type === 'key' ? 'License key' : 'Admin PIN'} copied to clipboard`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanTypeIcon = (planType: string) => {
    switch (planType) {
      case "lifetime":
        return "🌟";
      case "yearly":
        return "📅";
      case "quarterly":
        return "📆";
      case "monthly":
        return "📊";
      case "test":
      case "5min":
        return "🧪";
      default:
        return "🔑";
    }
  };

  const getTimeLeft = (expiresAt: string | null) => {
    if (!expiresAt) return { text: "Lifetime", isExpiringSoon: false };
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeLeft = expiry.getTime() - now.getTime();
    
    if (timeLeft <= 0) return { text: "Expired", isExpiringSoon: false };
    
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor(timeLeft / (1000 * 60));
    
    if (daysLeft > 0) {
      return { text: `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`, isExpiringSoon: daysLeft <= 3 };
    }
    if (hoursLeft > 0) {
      return { text: `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} left`, isExpiringSoon: true };
    }
    if (minutesLeft > 0) {
      return { text: `${minutesLeft} minute${minutesLeft > 1 ? 's' : ''} left`, isExpiringSoon: true };
    }
    return { text: "Less than a minute", isExpiringSoon: true };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Error Dialog */}
      <Dialog open={!!errorDialog} onOpenChange={() => setErrorDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {errorDialog?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="whitespace-pre-line">{errorDialog?.message}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setErrorDialog(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shop Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Select Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by shop name, ID or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => refetchShops()} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

         <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Shop Name</TableHead>
        <TableHead>Shop ID</TableHead>
        <TableHead>Owner</TableHead>
        <TableHead>City</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>License Status</TableHead>
        <TableHead>Activated Machine</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {shopsLoading ? (
        <TableRow>
          <TableCell colSpan={8} className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </TableCell>
        </TableRow>
      ) : filteredShops.length === 0 ? (
        <TableRow>
          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
            No shops found
          </TableCell>
        </TableRow>
      ) : (
        filteredShops.map((shop) => {
          const activeLicense = licenses.find(l => l.status === 'active');
          return (
            <TableRow key={shop.id} className={selectedShop?.id === shop.id ? "bg-muted" : ""}>
              <TableCell className="font-medium">{shop.name}</TableCell>
              <TableCell>{shop.shopId}</TableCell>
              <TableCell>{shop.owner}</TableCell>
              <TableCell>{shop.city}</TableCell>
              <TableCell>
                <Badge variant={shop.subscriptionStatus === "active" ? "default" : "secondary"}>
                  {shop.subscriptionStatus}
                </Badge>
              </TableCell>
              <TableCell>
                {activeLicense ? (
                  <Badge className="bg-green-100 text-green-800">Active License</Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">No Active License</Badge>
                )}
              </TableCell>
              <TableCell>
                {activeLicense?.computer_name ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Computer className="h-3 w-3" />
                      <span className="font-medium">{activeLicense.computer_name}</span>
                    </div>
                    {activeLicense.mac_address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Wifi className="h-2 w-2" />
                        <span>{activeLicense.mac_address}</span>
                      </div>
                    )}
                    {activeLicense.os_platform && (
                      <div className="text-xs text-muted-foreground">
                        {activeLicense.os_platform} {activeLicense.os_release}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Not activated</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={selectedShop?.id === shop.id ? "default" : "outline"}
                  onClick={async () => {
                    setSelectedShop(shop);
                    setGeneratedKey(null);
                    setGeneratedPin(null);
                    setCustomPin("");
                    setIsLicenseModalOpen(true);
                    await refetchLicenses();
                    await refetchShopStatus();
                  }}
                >
                  {selectedShop?.id === shop.id ? "Manage" : "Select"}
                </Button>
              </TableCell>
            </TableRow>
          );
        })
      )}
    </TableBody>
  </Table>
</div>
        </CardContent>
      </Card>

      {/* License Management Modal */}
      <Dialog open={isLicenseModalOpen && !!selectedShop} onOpenChange={(open) => {
        if (!open) {
          setIsLicenseModalOpen(false);
          if (!isChangePinModalOpen) {
            setSelectedShop(null);
          }
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>License Management - {selectedShop?.name}</DialogTitle>
            <DialogDescription>
              Manage licenses, view active/expired licenses, and generate new ones
            </DialogDescription>
          </DialogHeader>

          {/* Shop Status Summary */}
          {shopStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">Shop Subscription Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Subscription Status:</span>
                  <Badge className="ml-2" variant={shopStatus.shop.subscriptionStatus === 'active' ? "default" : "destructive"}>
                    {shopStatus.shop.subscriptionStatus}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Active License:</span>
                  <Badge className="ml-2" variant={shopStatus.hasActiveLicense ? "default" : "secondary"}>
                    {shopStatus.hasActiveLicense ? "Yes" : "No"}
                  </Badge>
                </div>
                {shopStatus.activeLicense?.expires_at && (
                  <div>
                    <span className="text-muted-foreground">License Expires:</span>
                    <span className="ml-2 font-mono text-sm">
                      {new Date(shopStatus.activeLicense.expires_at).toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Expired Licenses Count:</span>
                  <span className="ml-2">{shopStatus.expiredLicensesCount}</span>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Active Licenses ({licenses.filter(l => l.status === 'active').length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Expired Licenses ({licenses.filter(l => l.status === 'expired').length})
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                All Licenses ({licenses.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Licenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderLicenseTable(filteredLicenses, true)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expired" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Expired Licenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderLicenseTable(filteredLicenses, false)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Licenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderLicenseTable(filteredLicenses, false)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* License Generation Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Key className="h-5 w-5" />
              Generate New License
            </h3>
            
            {hasActiveLicense && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Active License Exists</p>
                  <p className="text-sm text-red-700 mt-1">
                    This shop already has an active license. Each shop can only have ONE active license at a time.
                    Please delete the current active license or wait for it to expire before generating a new one.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => setActiveTab("active")}
                  >
                    View Active License
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan Type</Label>
                <Select value={planType} onValueChange={setPlanType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">Test (5 minutes)</SelectItem>
                    <SelectItem value="test">Test (2 minutes)</SelectItem>
                    <SelectItem value="monthly">Monthly (30 days)</SelectItem>
                    <SelectItem value="quarterly">Quarterly (90 days)</SelectItem>
                    <SelectItem value="yearly">Yearly (365 days)</SelectItem>
                    <SelectItem value="lifetime">Lifetime (Never Expires)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {planType !== "lifetime" && planType !== "test" && planType !== "5min" && (
                <div>
                  <Label>Duration (Days)</Label>
                  <Input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value))}
                    min={1}
                    max={365}
                  />
                </div>
              )}
            </div>

            <div className="mt-4">
              <Label>Admin PIN (4-6 digits)</Label>
              <Input
                type="password"
                placeholder="Enter admin PIN for this shop"
                value={customPin}
                onChange={(e) => setCustomPin(e.target.value)}
                maxLength={6}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This PIN will be required for shop owner to activate the license
              </p>
            </div>

            <Button
              onClick={handleGenerateLicense}
              disabled={generateLicenseMutation.isPending || !customPin || customPin.length < 4 || hasActiveLicense}
              className="w-full mt-4"
            >
              {generateLicenseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Generate License & PIN
                </>
              )}
            </Button>

            {(generatedKey || generatedPin) && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-3 border border-green-200 mt-4">
                <h4 className="font-semibold text-green-800 dark:text-green-400">Successfully Generated!</h4>
                {generatedKey && (
                  <div>
                    <Label>License Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-background rounded font-mono text-sm">
                        {generatedKey}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedKey, 'key')}>
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {generatedPin && (
                  <div>
                    <Label>Admin PIN</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-background rounded font-mono text-sm font-bold">
                        {generatedPin}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedPin, 'pin')}>
                        {copiedPin ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change PIN Modal */}
      <Dialog open={isChangePinModalOpen} onOpenChange={setIsChangePinModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Admin PIN for {selectedShop?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current PIN</Label>
              <Input
                type="password"
                placeholder="Enter current PIN"
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>New PIN (4-6 digits)</Label>
              <Input
                type="password"
                placeholder="Enter new PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={6}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Confirm New PIN</Label>
              <Input
                type="password"
                placeholder="Confirm new PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength={6}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsChangePinModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleChangePin} disabled={changePinMutation.isPending} className="flex-1">
                {changePinMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Change PIN"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm License Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this license? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {licenseToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-800">License Details:</p>
                <p className="text-sm mt-2">
                  <span className="font-medium">Key:</span> {licenseToDelete.license_key}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Plan:</span> {licenseToDelete.plan_type}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span> {licenseToDelete.status}
                </p>
                {licenseToDelete.expires_at && (
                  <p className="text-sm">
                    <span className="font-medium">Expires:</span> {new Date(licenseToDelete.expires_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteLicense}
              disabled={deleteLicenseMutation.isPending}
            >
              {deleteLicenseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Helper function to render license table
  function renderLicenseTable(licensesList: License[], showChangePin: boolean) {
    if (licensesList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No licenses found
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>License Key</TableHead>
              <TableHead>Admin PIN</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hardware ID</TableHead>
              <TableHead>Activated At</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Time Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licensesList.map((license) => {
              const timeLeft = getTimeLeft(license.expires_at);
              
              return (
                <TableRow key={license.id} className={license.status === 'expired' ? 'bg-red-50/50' : ''}>
                  <TableCell>
                    <code className="text-xs font-mono">{license.license_key}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-xs font-mono">••••</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(license.admin_pin, 'pin')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    <span className="flex items-center gap-1">
                      <span>{getPlanTypeIcon(license.plan_type)}</span>
                      {license.plan_type}
                      {!license.expires_at && <Badge variant="outline" className="ml-1 text-xs">Lifetime</Badge>}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(license.status)}</TableCell>
                  <TableCell>
                    {license.hardware_id ? (
                      <code className="text-xs">{license.hardware_id.slice(0, 16)}...</code>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not activated</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {license.activated_at ? new Date(license.activated_at).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell>
                    {license.expires_at ? (
                      <div className="flex flex-col">
                        <span>{new Date(license.expires_at).toLocaleString()}</span>
                      </div>
                    ) : (
                      "Never (Lifetime)"
                    )}
                  </TableCell>
                  <TableCell>
                    {license.status === 'active' && license.expires_at && (
                      <Badge variant={timeLeft.isExpiringSoon ? "destructive" : "default"} className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {timeLeft.text}
                      </Badge>
                    )}
                    {license.status === 'expired' && (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                    {!license.expires_at && license.status === 'active' && (
                      <Badge className="text-xs bg-purple-500">
                        <Shield className="h-3 w-3 mr-1" />
                        Never Expires
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {license.status === 'active' && showChangePin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsChangePinModalOpen(true)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Change PIN
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setLicenseToDelete(license);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
}