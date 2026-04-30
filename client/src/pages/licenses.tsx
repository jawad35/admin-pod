import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Key, Copy, CheckCircle, AlertCircle, Loader2, Filter, History, Shield, RefreshCw } from "lucide-react";

interface Shop {
  id: string;
  shopId: string;
  name: string;
  owner: string;
  type: string;
  city: string;
  subscriptionStatus: string;
  permanentLicense: boolean;
}

interface License {
  id: string;
  license_key: string;
  admin_pin: string;
  shop_id: string;
  hardware_id: string | null;
  plan_type: string;
  duration_days: number | null;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
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
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Fetch all shops
  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
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

  // Fetch licenses for selected shop
  const { data: licenses = [], refetch: refetchLicenses } = useQuery<License[]>({
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
      return data.map((license: License) => {
        if (license.expires_at && new Date(license.expires_at) < now && license.status === 'active') {
          return { ...license, status: 'expired' };
        }
        return license;
      });
    },
    enabled: !!selectedShop,
    refetchInterval: 1000,
  });

  // Filter licenses for history modal
  const filteredHistoryLicenses = licenses.filter(license => {
    if (historyStatusFilter === "all") return true;
    return license.status === historyStatusFilter;
  });

  const totalPages = Math.ceil(filteredHistoryLicenses.length / itemsPerPage);
  const paginatedLicenses = filteredHistoryLicenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Generate license mutation (creates both license key and admin PIN)
  const generateLicenseMutation = useMutation({
    mutationFn: async (data: { shopId: string; planType: string; durationDays: number; adminPin: string }) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/generate-license-with-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate license");
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.license.license_key);
      setGeneratedPin(data.admin_pin);
      toast({
        title: "License & PIN Generated",
        description: `License key and admin PIN created successfully`,
      });
      refetchLicenses();
      setCustomPin("");
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

    if (!customPin || customPin.length < 4) {
      toast({
        title: "Error",
        description: "Please enter an admin PIN (minimum 4 digits)",
        variant: "destructive",
      });
      return;
    }

    let actualDurationDays = durationDays;
    if (planType === "test") {
      actualDurationDays = 0.00035;
    }

    generateLicenseMutation.mutate({
      shopId: selectedShop.id,
      planType,
      durationDays: planType === "test" ? null : actualDurationDays,
      durationMinutes: planType === "test" ? 2 : null,
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

  return (
    <div className="p-6 space-y-6">
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shopsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredShops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No shops found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShops.map((shop) => (
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
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={selectedShop?.id === shop.id ? "default" : "outline"}
                            onClick={() => {
                              setSelectedShop(shop);
                              setGeneratedKey(null);
                              setGeneratedPin(null);
                              setCustomPin("");
                              setIsLicenseModalOpen(true);
                            }}
                          >
                            {selectedShop?.id === shop.id ? "Manage" : "Select"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedShop(shop);
                              setIsHistoryModalOpen(true);
                              setCurrentPage(1);
                              setHistoryStatusFilter("all");
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* License Management Modal */}
      <Dialog open={isLicenseModalOpen && !!selectedShop && !isHistoryModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsLicenseModalOpen(false);
          setSelectedShop(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage License for {selectedShop?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* License Generation Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Key className="h-5 w-5" />
                Generate New License
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan Type</Label>
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Test (2 minutes)</SelectItem>
                      <SelectItem value="monthly">Monthly (30 days)</SelectItem>
                      <SelectItem value="quarterly">Quarterly (90 days)</SelectItem>
                      <SelectItem value="yearly">Yearly (365 days)</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {planType !== "lifetime" && planType !== "test" && (
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

              <div>
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
                disabled={generateLicenseMutation.isPending || !customPin || customPin.length < 4}
                className="w-full"
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
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-3 border border-green-200">
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

            {/* Existing Licenses Section */}
            {/* {licenses[10].length > 0 && (
              <>
                <div className="border-t" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Existing Licenses
                  </h3>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>License Key</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {licenses.map((license) => (
                          <TableRow key={license.id}>
                            <TableCell>
                              <code className="text-xs font-mono">{license.license_key}</code>
                            </TableCell>
                            <TableCell>{getStatusBadge(license.status)}</TableCell>
                            <TableCell className="capitalize">{license.plan_type}</TableCell>
                            <TableCell>
                              {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : "Lifetime"}
                            </TableCell>
                            <TableCell>
                              {license.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsChangePinModalOpen(true)}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Change PIN
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )} */}
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

      {/* License History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>License History for {selectedShop?.name}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {filteredHistoryLicenses.length} licenses
            </div>
          </div>

          <div className="border rounded-lg overflow-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>Admin PIN</TableHead>
                  <TableHead>Plan Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hardware ID</TableHead>
                  <TableHead>Activated At</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLicenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No licenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLicenses.map((license) => (
                    <TableRow key={license.id}>
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
                      <TableCell className="capitalize">{license.plan_type}</TableCell>
                      <TableCell>{getStatusBadge(license.status)}</TableCell>
                      <TableCell>
                        {license.hardware_id ? (
                          <code className="text-xs">{license.hardware_id.slice(0, 16)}...</code>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {license.activated_at ? new Date(license.activated_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        {license.expires_at ? new Date(license.expires_at).toLocaleString() : "Lifetime"}
                      </TableCell>
                      <TableCell>{new Date(license.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredHistoryLicenses.length)} of {filteredHistoryLicenses.length} licenses
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}