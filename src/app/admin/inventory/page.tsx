"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Plus, AlertTriangle, History, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/Button";

interface InventoryItem {
  id: string;
  story_id: string;
  current_stock: number;
  low_stock_threshold: number;
  updated_at: string;
  stories: { title: string; cover_image: string };
}

interface Transaction {
  id: string;
  transaction_type: string;
  quantity_change: number;
  notes: string;
  created_at: string;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Restock Modal State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState("");
  const [isRestocking, setIsRestocking] = useState(false);

  // History Modal State
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*, stories(title, cover_image)")
      .order("current_stock", { ascending: true });

    if (data) setItems(data as InventoryItem[]);
    setIsLoading(false);
  };

  const openRestockModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setRestockAmount("");
  };

  const handleRestock = async () => {
    if (!selectedItem || !restockAmount) return;
    
    const amount = parseInt(restockAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive number.");
      return;
    }

    setIsRestocking(true);
    
    // 1. Update stock
    const { error: updateError } = await supabase
      .from("inventory_items")
      .update({ 
        current_stock: selectedItem.current_stock + amount,
        updated_at: new Date().toISOString()
      })
      .eq("id", selectedItem.id);

    if (updateError) {
      toast.error("Failed to update stock.");
      setIsRestocking(false);
      return;
    }

    // 2. Log transaction
    await supabase.from("inventory_transactions").insert({
      inventory_item_id: selectedItem.id,
      transaction_type: "restock",
      quantity_change: amount,
      notes: "Manual restock by admin",
      created_by: (await supabase.auth.getUser()).data.user?.id
    });

    toast.success(`Added ${amount} copies to inventory.`);
    setIsRestocking(false);
    setSelectedItem(null);
    fetchInventory();
  };

  const openHistoryModal = async (item: InventoryItem) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    
    const { data } = await supabase
      .from("inventory_transactions")
      .select("*")
      .eq("inventory_item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setTransactions(data as Transaction[]);
    setLoadingHistory(false);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= 0) return { text: "Out of Stock", color: "text-red-400 bg-red-500/10" };
    if (item.current_stock <= item.low_stock_threshold) return { text: "Low Stock", color: "text-yellow-400 bg-yellow-500/10" };
    return { text: "In Stock", color: "text-green-400 bg-green-500/10" };
  };

  if (isLoading) return <div className="p-8 text-gray-light/50">Loading inventory...</div>;

  return (
    <div className="space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div>
        <h1 className="text-3xl font-bold text-white">Inventory</h1>
        <p className="text-gray-light/60 mt-1">Track physical stock levels and movements.</p>
      </div>

      {/* Inventory List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-gray-light/50 text-sm">
                <th className="p-4">Story</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-light/40">
                    No inventory items found. Stock is automatically created when orders are confirmed.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={item.stories.cover_image} alt="" className="w-10 h-14 object-cover rounded-lg" />
                          <span className="font-semibold text-white">{item.stories.title}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xl font-bold text-white">{item.current_stock}</span>
                        <span className="text-xs text-gray-light/40 ml-2">copies</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-light/50">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openHistoryModal(item)}
                            className="p-2 text-gray-light/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="View History"
                          >
                            <History size={16} />
                          </button>
                          <button
                            onClick={() => openRestockModal(item)}
                            className="p-2 text-brand hover:bg-brand/10 rounded-full transition-colors"
                            title="Add Stock"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => !isRestocking && setSelectedItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md glass rounded-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Add Stock</h2>
              <p className="text-gray-light/60 text-sm mb-6">
                Adding copies for <strong className="text-white">{selectedItem.stories.title}</strong>
              </p>
              
              <input
                type="number"
                min="1"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                placeholder="Quantity to add"
                className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 mb-4"
              />

              <div className="flex gap-3">
                <Button variant="primary" className="flex-1 justify-center" onClick={handleRestock} disabled={isRestocking}>
                  {isRestocking ? "Adding..." : "Confirm Restock"}
                </Button>
                <Button variant="secondary" className="flex-1 justify-center" onClick={() => setSelectedItem(null)} disabled={isRestocking}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {historyItem && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setHistoryItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg glass rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Stock History</h2>
                <button onClick={() => setHistoryItem(null)} className="p-2 text-gray-light/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {loadingHistory ? (
                <p className="text-gray-light/50 text-center py-8">Loading history...</p>
              ) : transactions.length === 0 ? (
                <p className="text-gray-light/50 text-center py-8">No transactions found.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white capitalize">{tx.transaction_type.replace("_", " ")}</p>
                        <p className="text-xs text-gray-light/50 mt-1">{tx.notes}</p>
                        <p className="text-xs text-gray-light/40 mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`text-lg font-bold ${tx.quantity_change > 0 ? "text-green-400" : "text-red-400"}`}>
                        {tx.quantity_change > 0 ? "+" : ""}{tx.quantity_change}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}