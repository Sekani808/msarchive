// src/components/ui/UnlockModal.tsx
"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Unlock, CheckCircle, Loader2, ArrowLeft, ArrowRight, Copy } from "lucide-react";
import { Button } from "./Button";
import { Story } from "@/types/story";
import { useUnlockStore } from "@/store/useUnlockStore";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useSettingsStore } from "@/store/useSettingsStore";

// Custom WhatsApp Icon Component (Official Logo)
const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

// Your 4 Payment Methods
const paymentMethods = [
  {
    id: 'mo626',
    name: 'Mo626',
    subtitle: 'National Bank',
    type: 'Bank Account',
    account: '1011249848',
    instructions: 'Dial *626# and follow the USSD instructions to send money to the account number above.',
    image: '/assets/images/payments/mo626.png',
    color: 'bg-blue-600'
  },
  {
    id: '247',
    name: '*247#',
    subtitle: 'Standard Bank',
    type: 'Bank Account',
    account: '9100008167629',
    instructions: 'Dial *247# and follow the USSD instructions to send money to the account number above.',
    image: '/assets/images/payments/247.png',
    color: 'bg-purple-600'
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    subtitle: 'Mobile Money',
    type: 'Phone Number',
    account: '0980720991',
    instructions: 'Dial *211# and follow the USSD instructions to send money to the phone number above.',
    image: '/assets/images/payments/airtel-money.png',
    color: 'bg-red-500'
  },
  {
    id: 'mpamba',
    name: 'Mpamba',
    subtitle: 'TNM Mobile Money',
    type: 'Phone Number',
    account: '0882057151',
    instructions: 'Dial *444# and follow the USSD instructions to send money to the phone number above.',
    image: '/assets/images/payments/mpamba.jpg',
    color: 'bg-green-500'
  }
];

interface UnlockModalProps {
  story: Story | null;
  onClose: () => void;
}

export default function UnlockModal({ story, onClose }: UnlockModalProps) {
  const [step, setStep] = useState<'select-payment' | 'choose-method' | 'payment-instructions' | 'enter-code' | 'success'>('select-payment');
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<typeof paymentMethods[0] | null>(null);
  const unlockStory = useUnlockStore((state) => state.unlockStory);
  
  // 1. Initialize the Settings Store
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  if (!story) return null;

  // 2. Dynamic WhatsApp Link using the database settings
  const getWhatsappLink = () => {
    const methodName = selectedMethod?.name || 'Mobile Money';
    // Clean the phone number for the wa.me link (removes +, spaces, etc.)
    const cleanNumber = settings?.whatsapp_number?.replace(/[^0-9]/g, '') || '265980720991';
    const msg = `Hi! I want to unlock the story "${story.title}" (ID: ${story.id}). I have made the payment of ${story.price_mwk} MWK via ${methodName}. Here is my screenshot.`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  };

  // The database verification logic (unchanged)
  const handleVerifyCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter a code.");
      return;
    }

    setIsVerifying(true);

    let deviceId = localStorage.getItem('msarchive_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('msarchive_device_id', deviceId);
    }

    try {
      const { data, error } = await supabase
        .from("unlock_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("story_id", story.id)
        .single();

      if (error || !data) {
        toast.error("Invalid code. Please check and try again.");
        setIsVerifying(false);
        return;
      }

      const usedCodes = JSON.parse(localStorage.getItem('msarchive_used_codes') || '[]');
      if (usedCodes.includes(data.id)) {
        toast.error("You have already unlocked this story on this device.");
        setIsVerifying(false);
        return;
      }

      if (data.devices_used >= data.max_devices) {
        toast.error("This code has reached its maximum usage limit.");
        setIsVerifying(false);
        return;
      }

      // 4. Increment the global counter and reactivate if it was revoked
      const { error: updateError } = await supabase
        .from("unlock_codes")
        .update({ 
          devices_used: data.devices_used + 1,
          is_revoked: false // Reactivate the code for revenue tracking!
        })
        .eq("id", data.id);

      if (updateError) throw updateError;

      unlockStory(story.id);
      usedCodes.push(data.id);
      localStorage.setItem('msarchive_used_codes', JSON.stringify(usedCodes));

      setStep('success');
      
      setTimeout(() => {
        onClose();
        setStep('select-payment');
        setCode("");
      }, 2500);

    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md glass rounded-3xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-light/70 z-10">
            <X size={20} />
          </button>

          {/* STEP 1: SELECT PAYMENT */}
          {step === 'select-payment' && (
            <div className="space-y-6 pt-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-accent-purple/20 rounded-full flex items-center justify-center mb-4">
                  <Lock className="text-accent-purple" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">{story.title}</h3>
                <p className="text-brand font-bold text-lg mt-2">{story.price_mwk} MWK</p>
              </div>

              <p className="text-center text-gray-light/70 text-sm">
                Select a payment method below to unlock this premium story.
              </p>

              <div className="space-y-3">
                <Button variant="primary" className="w-full" onClick={() => setStep('choose-method')}>
                  Select Payment Method
                </Button>
                
                <Button variant="secondary" className="w-full" onClick={() => setStep('enter-code')}>
                  I already have an unlock code
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE METHOD */}
          {step === 'choose-method' && (
            <div className="space-y-6 pt-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white">Choose Payment Method</h3>
                <p className="text-sm text-gray-light/60 mt-1">Select your preferred way to pay.</p>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <motion.button
                    key={method.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedMethod(method); setStep('payment-instructions'); }}
                    className="w-full flex items-center gap-4 p-4 glass rounded-2xl hover:bg-white/5 transition-colors text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                      <img src={method.image} alt={method.name} className="w-full h-full object-contain p-1" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{method.name}</p>
                      <p className="text-xs text-gray-light/60">{method.subtitle}</p>
                    </div>
                    <ArrowRight className="text-gray-light/40" size={18} />
                  </motion.button>
                ))}
              </div>

              <button onClick={() => setStep('select-payment')} className="w-full text-center text-sm text-gray-light/50 hover:text-white flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}

          {/* STEP 3: PAYMENT INSTRUCTIONS */}
          {step === 'payment-instructions' && selectedMethod && (
            <div className="space-y-6 pt-4">
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto rounded-2xl ${selectedMethod.color} flex items-center justify-center mb-4 overflow-hidden shadow-lg`}>
                   <img src={selectedMethod.image} alt={selectedMethod.name} className="w-full h-full object-contain p-2" />
                </div>
                <h3 className="text-2xl font-bold text-white">{selectedMethod.name}</h3>
                <p className="text-sm text-gray-light/60">{selectedMethod.subtitle}</p>
              </div>

              <div className="bg-navy-dark/50 p-4 rounded-xl border border-white/10 text-center">
                <p className="text-xs text-gray-light/50 uppercase font-bold tracking-wider mb-1">
                  {selectedMethod.type}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-mono font-bold text-brand tracking-wider">
                    {selectedMethod.account}
                  </p>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(selectedMethod.account); toast.success("Copied!"); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-light/50 hover:text-white transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-sm text-white font-semibold mt-1">Sekani Msachi</p>
              </div>

              <div className="bg-navy-dark/30 p-4 rounded-xl border-l-4 border-brand">
                <p className="text-sm text-gray-light/80 leading-relaxed">
                  <strong className="text-white">Instructions:</strong> {selectedMethod.instructions}
                </p>
              </div>

              <a href={getWhatsappLink()} target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button variant="primary" className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white border-b-4 border-b-[#128C46] shadow-[0_4px_0_#128C46]">
                  <WhatsAppIcon size={20} />
                  Send Screenshot on WhatsApp
                </Button>
              </a>

              <Button variant="secondary" className="w-full" onClick={() => setStep('enter-code')}>
                I have paid, enter my code
              </Button>

              <button onClick={() => setStep('choose-method')} className="w-full text-center text-sm text-gray-light/50 hover:text-white flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> Choose another method
              </button>
            </div>
          )}

          {/* STEP 4: ENTER CODE */}
          {step === 'enter-code' && (
            <div className="space-y-6 pt-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Enter Unlock Code</h3>
                <p className="text-sm text-gray-light/70">Paste the code sent by the admin.</p>
              </div>

              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MS-8472-ABCD"
                className="w-full glass rounded-xl py-4 px-4 text-center text-2xl font-mono tracking-widest text-white placeholder-gray-light/30 focus:outline-none focus:ring-2 focus:ring-brand/50"
                maxLength={15}
              />

              <Button variant="primary" className="w-full" onClick={handleVerifyCode} disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Unlock size={18} />
                    Unlock Story
                  </>
                )}
              </Button>
              
              <button onClick={() => setStep(selectedMethod ? 'payment-instructions' : 'select-payment')} className="w-full text-center text-sm text-gray-light/50 hover:text-white flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}

          {/* STEP 5: SUCCESS ANIMATION */}
          {step === 'success' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8 space-y-4"
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle className="mx-auto text-brand" size={64} />
              </motion.div>
              <h3 className="text-2xl font-bold text-white">Story Unlocked!</h3>
              <p className="text-gray-light/70">Enjoy your reading.</p>
              <div className="inline-block px-4 py-1 bg-brand/20 text-brand text-xs font-bold rounded-full">
                Purchased ✓
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}