// components/modals/payment-history-modal.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, DollarSign, CheckCircle, Clock, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

interface PaymentHistory {
  id: string;
  amount: string;
  paymentMonth: string;      // Changed from payment_month
  paymentDate: string;       // Changed from payment_date
  paymentMethod: string;     // Changed from payment_method
  status: string;            // Changed from payment_status
  receiptNumber: string;     // Changed from receipt_number
  collectedBy: string;       // Changed from collected_by
  notes: string;
  subscriptionId?: string;
  createdAt?: string;
}

interface PaymentHistoryModalProps {
  shop: any;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentHistoryModal({ shop, isOpen, onClose }: PaymentHistoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingPayment, setEditingPayment] = useState<PaymentHistory | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: shop?.monthlyFee || "0",
    paymentMethod: "cash",
    collectedBy: "",
    notes: "",
  });

const { data: paymentData, isLoading, refetch } = useQuery({
  queryKey: ["/api/payment-history", shop?.id, currentPage],
  queryFn: async () => {
    if (!shop?.id) return { payments: [], total: 0 };
    
    console.log("Fetching payment history for shop:", shop.id);
    
    try {
      // Use fetch directly instead of apiRequest to see what's happening
      const response = await fetch(`/api/shops/${shop.id}/payment-history?page=${currentPage}&limit=${itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Payment history data:", data);
      
      return {
        payments: data.payments || [],
        total: data.total || 0,
        page: data.page,
        totalPages: data.totalPages
      };
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return { payments: [], total: 0 };
    }
  },
  enabled: isOpen && !!shop?.id,
});

  const payments = paymentData?.payments || [];
  const totalPayments = paymentData?.total || 0;
  const totalPages = Math.ceil(totalPayments / itemsPerPage);

// In PaymentHistoryModal, update the mutation:

const markAsPaidMutation = useMutation({
  mutationFn: async (data: { paymentMonth: Date; amount: string; paymentMethod: string; collectedBy: string; notes: string }) => {
    console.log("Sending payment data:", {
      shopId: shop.id,
      paymentMonth: data.paymentMonth,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      collectedBy: data.collectedBy,
      notes: data.notes,
    });
    
    const response = await apiRequest("POST", `/api/shops/${shop.id}/mark-paid`, {
      paymentMonth: data.paymentMonth,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      collectedBy: data.collectedBy,
      notes: data.notes,
    });
    
    console.log("Response status:", response.status);
    const responseData = await response;
    console.log("Response data:", responseData);
    
    return responseData;
  },
  onSuccess: () => {
    toast({ title: "Success", description: "Payment marked as paid successfully" });
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
    setShowAddModal(false);
    resetForm();
  },
  onError: (error: any) => {
    console.error("Full error object:", error);
    toast({ 
      title: "Error", 
      description: error.message || "Failed to mark payment", 
      variant: "destructive" 
    });
  },
});

const updatePaymentMutation = useMutation({
  mutationFn: async ({ paymentId, data }: { paymentId: string; data: any }) => {
    console.log("Updating payment:", paymentId, data);
    const response = await apiRequest("PUT", `/api/payments/${paymentId}`, data);
    // apiRequest might return the parsed data directly
    const result = await response;
    console.log("Update response:", result);
    return result;
  },
  onSuccess: (data) => {
    toast({ title: "Success", description: "Payment updated successfully" });
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
    setEditingPayment(null);
    resetForm();
  },
  onError: (error: any) => {
    console.error("Update error:", error);
    toast({ title: "Error", description: error.message || "Failed to update payment", variant: "destructive" });
  },
});

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await apiRequest("DELETE", `/api/payments/${paymentId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment deleted successfully" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to delete payment", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: shop?.monthlyFee || "0",
      paymentMethod: "cash",
      collectedBy: "",
      notes: "",
    });
  };

  const handleMarkAsPaid = () => {
    if (!formData.collectedBy) {
      toast({ title: "Error", description: "Please enter collector name", variant: "destructive" });
      return;
    }
    markAsPaidMutation.mutate({
      paymentMonth: new Date(),
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      collectedBy: formData.collectedBy,
      notes: formData.notes,
    });
  };

 const handleUpdatePayment = () => {
  if (!editingPayment) return;
  
  const updateData = {
    amount: formData.amount,
    paymentMethod: formData.paymentMethod,  // Use camelCase
    collectedBy: formData.collectedBy,      // Use camelCase
    notes: formData.notes,
  };
  
  console.log("Sending update data:", updateData);
  
  updatePaymentMutation.mutate({
    paymentId: editingPayment.id,
    data: updateData,
  });
};

  const handleDeletePayment = (paymentId: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      deletePaymentMutation.mutate(paymentId);
    }
  };

 const getCurrentMonthStatus = () => {
  const currentMonthPayment = payments.find((payment: PaymentHistory) => {
    const paymentMonth = new Date(payment.paymentMonth);
    const now = new Date();
    return paymentMonth.getMonth() === now.getMonth() && 
           paymentMonth.getFullYear() === now.getFullYear() &&
           payment.status === 'paid';
  });
  return !!currentMonthPayment;
};

  const isCurrentMonthPaid = getCurrentMonthStatus();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center flex-wrap gap-4">
              <span>Payment History - {shop?.name}</span>
              <div className="flex gap-4">
                <div className="text-sm font-normal">
                  Total Revenue: <span className="font-bold text-green-600">PKR {paymentData?.total || 0}</span>
                </div>
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Manual Payment
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>


          {/* Current Month Status */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-semibold">Current Month Status</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{format(new Date(), 'MMMM yyyy')}</p>
              </div>
              {isCurrentMonthPaid ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Paid
                </Badge>
              ) : (
                <Button onClick={() => setShowAddModal(true)} size="sm">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>

          {/* Payment History Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount (PKR)</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Collected By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
  {payments.map((payment: PaymentHistory) => (
    <TableRow key={payment.id}>
      <TableCell>{format(new Date(payment.paymentMonth), 'MMMM yyyy')}</TableCell>
      <TableCell>PKR {payment.amount}</TableCell>
      <TableCell>{format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm')}</TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {payment.paymentMethod}
        </Badge>
      </TableCell>
      <TableCell>{payment.collectedBy || '-'}</TableCell>
      <TableCell>
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-sm">{payment.receiptNumber}</TableCell>
      <TableCell>
        <div className="flex gap-2">
         <Button
  size="sm"
  variant="ghost"
  onClick={() => {
    setEditingPayment(payment);
    setFormData({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,  // Changed from payment_method
      collectedBy: payment.collectedBy || "", // Changed from collected_by
      notes: payment.notes || "",
    });
  }}
>
  <Edit className="w-4 h-4" />
</Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeletePayment(payment.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalPayments)} of {totalPayments} payments
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

      {/* Add/Edit Payment Modal */}
      <Dialog open={showAddModal || !!editingPayment} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false);
          setEditingPayment(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? "Edit Payment" : "Add Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (PKR)</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Collected By (Name)</Label>
              <Input
                value={formData.collectedBy}
                onChange={(e) => setFormData({ ...formData, collectedBy: e.target.value })}
                placeholder="Enter collector name"
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowAddModal(false);
                setEditingPayment(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={editingPayment ? handleUpdatePayment : handleMarkAsPaid}>
                {editingPayment ? "Update" : "Mark as Paid"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}