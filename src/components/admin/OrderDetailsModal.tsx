"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Save, Loader2, User, Phone, BookOpen, Hash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { HardCopyOrderStatus } from "@/types/hardCopyOrder";

interface OrderWithStory {
  id: string;
  story_id: string;
  customer_name: string;
  whatsapp_number: string;
  quantity: number;
  unit_price_mwk: number;
  total_price_mwk: number;
  status: HardCopyOrderStatus;
  admin_notes: string | null;
  created_at: string;
  stories: { title: string; cover_image: string } | null;
}

interface Props {
  order: OrderWithStory;
  onClose: () => void;
  onUpdated: () => void;
}

export default function OrderDetailsModal({ order, onClose, onUpdated }: Props) {
  const [status, setStatus] = useState<HardCopyOrderStatus>(order.status);
  const [notes, setNotes] = useState(order.admin_notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const waNumber = order.whatsapp_number.replace(/[^0-9]/g, "");
  const waMessage = encodeURIComponent(`Hi ${order.customer_name}, this is Msarchive regarding your order for "${order.stories?.title}".`);
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // 1. Update the order
      const { error: orderError } = await supabase
        .from("hard_copy_orders")
        .update({ 
          status, 
          admin_notes: notes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      // 2. Process inventory changes if status changed
      if (status !== order.status) {
        const { error: inventoryError } = await supabase.rpc('process_order_inventory', {
          p_order_id: order.id,
          p_new_status: status,
          p_old_status: order.status
        });

        if (inventoryError) {
          console.error("Inventory processing failed:", inventoryError);
          toast.warning("Order updated, but inventory adjustment failed.");
        }
      }

      toast.success("Order updated successfully.");
      onUpdated();
      
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to update order.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "contacted": return "bg-blue-500/20 text-blue-400";
      case "confirmed": return "bg-brand/20 text-brand";
      case "delivered": return "bg-green-500/20 text-green-400";
      case "cancelled": return "bg-red-500/20 text-red-400";
      default: return "bg-white/10 text-gray-light";
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl glass rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-light/70 z-10">
            <X size={20} />
          </button>

          <h2 className="text-2xl font-bold text-white mb-6">Order Details</h2>

          <div className="flex gap-4 bg-navy-dark/50 p-4 rounded-2xl border border-white/5 mb-6">
            <img src={order.stories?.cover_image || ""} alt="Cover" className="w-16 h-24 object-cover rounded-lg border border-white/10" />
            <div className="flex-1">
              <p className="text-xs text-gray-light/50 uppercase font-bold tracking-wider">Item</p>
              <p className="text-lg font-bold text-white">{order.stories?.title}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-light/70">
                <span>{order.quantity} × {order.unit_price_mwk.toLocaleString()} MWK</span>
              </div>
              <p className="text-xl font-bold text-brand mt-1">Total: {order.total_price_mwk.toLocaleString()} MWK</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-gray-light/50 text-xs uppercase font-bold mb-2">
                <User size={14} /> Customer
              </div>
              <p className="text-white font-semibold">{order.customer_name}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-gray-light/50 text-xs uppercase font-bold mb-2">
                <Phone size={14} /> WhatsApp
              </div>
              <p className="text-white font-semibold">{order.whatsapp_number}</p>
            </div>
          </div>

          <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full mb-6">
            <Button variant="primary" className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white border-b-4 border-b-[#128C46] shadow-[0_4px_0_#128C46] justify-center gap-2">
              <MessageCircle size={18} />
              Contact on WhatsApp
            </Button>
          </a>

          <div className="space-y-4 border-t border-white/5 pt-6">
            <div>
              <label className="text-sm font-medium text-gray-light/80 mb-2 block">Order Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as HardCopyOrderStatus)}
                className={`w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 font-semibold ${getStatusColor(status)}`}
              >
                <option value="pending" className="bg-navy-dark text-white">Pending</option>
                <option value="contacted" className="bg-navy-dark text-white">Contacted</option>
                <option value="confirmed" className="bg-navy-dark text-white">Confirmed</option>
                <option value="delivered" className="bg-navy-dark text-white">Delivered</option>
                <option value="cancelled" className="bg-navy-dark text-white">Cancelled</option>
              </select>
              <p className="text-xs text-gray-light/40 mt-1">
                Stock is automatically deducted when marked as Confirmed or Delivered.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-light/80 mb-2 block">Admin Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Delivery address, payment confirmation, etc..."
                className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-light/40 mb-2">
              <span>Order ID: {order.id.substring(0, 8)}...</span>
              <span>Placed: {new Date(order.created_at).toLocaleString()}</span>
            </div>

            <Button variant="primary" className="w-full justify-center gap-2" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="animate-spin" size={18} /> Saving...</>
              ) : (
                <><Save size={18} /> Update Order</>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}