// src/app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Save, Mail, Phone, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast, Toaster } from "sonner";
import { supabase } from "@/lib/supabase";

export default function AdminSettingsPage() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch settings from the database when the page loads
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single();

      if (data) {
        setSettingsId(data.id);
        setWhatsappNumber(data.whatsapp_number || "");
        setAdminEmail(data.admin_email || "");
        setPaymentInstructions(data.payment_instructions || "");
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, []);

  // 2. Save settings to the database
  const handleSave = async () => {
    setIsSaving(true);

    const payload = {
      whatsapp_number: whatsappNumber,
      admin_email: adminEmail,
      payment_instructions: paymentInstructions,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (settingsId) {
      // Update the existing row
      const res = await supabase.from("settings").update(payload).eq("id", settingsId);
      error = res.error;
    } else {
      // If for some reason the row doesn't exist, create it
      const res = await supabase.from("settings").insert(payload);
      error = res.error;
    }

    if (error) {
      toast.error("Failed to save settings.");
      console.error(error);
    } else {
      toast.success("Settings saved successfully!");
    }
    
    setIsSaving(false);
  };

  // Show a loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-light/60 mt-1">Manage your app configuration.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block flex items-center gap-2">
            <MessageCircle className="text-green-400" size={16} />
            WhatsApp Number (for payment verification)
          </label>
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block flex items-center gap-2">
            <Mail className="text-accent-blue" size={16} />
            Admin Email
          </label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block flex items-center gap-2">
            <Phone className="text-brand" size={16} />
            Payment Instructions (shown to users)
          </label>
          <textarea
            value={paymentInstructions}
            onChange={(e) => setPaymentInstructions(e.target.value)}
            rows={4}
            className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
          />
        </div>

        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">App Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-light/60">Version</span>
            <span className="text-white font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-light/60">Platform</span>
            <span className="text-white font-medium">Next.js 16 + Supabase</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-light/60">Last Updated</span>
            <span className="text-white font-medium">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}