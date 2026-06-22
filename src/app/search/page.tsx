// src/app/search/page.tsx
"use client";

import { motion } from "framer-motion";
import { 
  BookOpen, 
  Lock, 
  CreditCard, 
  CheckCircle, 
  ArrowRight,
  Download,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore"; // Added import

// Custom WhatsApp Icon Component (Official Logo)
const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

export default function HelpPage() {
  const [showThrob, setShowThrob] = useState(true);
  
  // 1. Initialize the Settings Store
  const { settings, fetchSettings } = useSettingsStore();

  // Stop throbbing after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowThrob(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // 2. Fetch settings from the database
  useEffect(() => {
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  const steps = [
    {
      icon: BookOpen,
      title: "Browse the Library",
      description: "Explore my collection of free and premium stories. Filter by category or search for specific titles."
    },
    {
      icon: Lock,
      title: "Select a Premium Story",
      description: "Premium stories are marked with a lock icon and price tag. Tap on any story to begin the unlock process."
    },
    {
      icon: CreditCard,
      title: "Choose Payment Method",
      description: "Select your preferred option: Mo626 (National Bank), *247# (Standard Bank), Airtel Money (*211#), or Mpamba (*444#)."
    },
    {
      icon: CheckCircle,
      title: "Send Payment & Screenshot",
      description: "Complete your payment using the provided account details and send a screenshot to my WhatsApp for verification."
    },
    {
      icon: Download,
      title: "Receive & Enter Code",
      description: "As the admin, I will verify your payment and send you a unique unlock code via WhatsApp. Enter it in the app to unlock the story instantly!"
    }
  ];

  const paymentMethods = [
    {
      name: "Mo626",
      subtitle: "National Bank",
      code: "*626#",
      image: "/assets/images/payments/mo626.png",
      color: "bg-blue-600"
    },
    {
      name: "*247#",
      subtitle: "Standard Bank",
      code: "*247#",
      image: "/assets/images/payments/247.png",
      color: "bg-purple-600"
    },
    {
      name: "Airtel Money",
      subtitle: "Mobile Money",
      code: "*211#",
      image: "/assets/images/payments/airtel-money.png",
      color: "bg-red-500"
    },
    {
      name: "Mpamba",
      subtitle: "TNM Mobile Money",
      code: "*444#",
      image: "/assets/images/payments/mpamba.jpg",
      color: "bg-green-500"
    }
  ];

  return (
    <main className="min-h-screen px-6 pt-12 pb-24 max-w-4xl mx-auto">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand/20 mb-4 ${showThrob ? 'animate-throb' : ''}`}>
          <AlertCircle className="text-brand" size={40} />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">How It Works</h1>
        <p className="text-gray-light/70">Your complete guide to unlocking and reading stories</p>
      </motion.div>

      {/* Step-by-Step Guide */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <ArrowRight className="text-brand" size={24} /> Getting Started
        </h2>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-5 flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center">
                    <Icon className="text-brand" size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-sm text-gray-light/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Payment Methods */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <CreditCard className="text-accent-blue" size={24} /> Payment Methods
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method, index) => {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6 text-center"
              >
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className={`absolute inset-0 ${method.color} opacity-20 blur-xl rounded-full`} />
                  <img 
                    src={method.image} 
                    alt={method.name}
                    className="relative w-32 h-32 object-contain rounded-xl"
                    onError={(e) => {
                      // Fallback if image doesn't load
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%237BC943" width="128" height="128" rx="8"/%3E%3Ctext fill="white" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{method.name}</h3>
                <p className="text-sm text-gray-light/60 mb-2">{method.subtitle}</p>
                <p className="text-2xl font-mono font-bold text-brand mb-2">{method.code}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* WhatsApp Instructions */}
      <section className="mb-12">
        <div className="glass rounded-3xl p-6 md:p-8 border border-green-500/30 bg-green-500/5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <WhatsAppIcon size={28} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Important: Send Your Screenshot!</h2>
              <p className="text-gray-light/80 leading-relaxed mb-4">
                After completing your payment, <strong className="text-brand">take a screenshot</strong> of the payment confirmation and send it to our WhatsApp number along with:
              </p>
              <ul className="space-y-2 text-gray-light/70">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>The story title you want to unlock</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>Your payment screenshot</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>Your full name for verification</span>
                </li>
              </ul>
              <a 
                // 3. Dynamic WhatsApp Link using the database settings
                href={`https://wa.me/${settings?.whatsapp_number?.replace(/[^0-9]/g, '') || '265980720991'}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full font-bold transition-all active:scale-95"
              >
                <WhatsAppIcon size={20} />
                Contact on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Unlock Code Info */}
      <section>
        <div className="glass rounded-3xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-accent-purple" size={24} /> About Unlock Codes
          </h2>
          <div className="space-y-4 text-gray-light/80">
            <p>
              Once I verify your payment (usually within <strong className="text-white">24 hours</strong>), you will receive a unique unlock code via WhatsApp.
            </p>
            <div className="bg-navy-dark/50 rounded-xl p-4 border-l-4 border-brand">
              <p className="text-sm mb-2"><strong className="text-brand">How to use your code:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-light/70">
                <li>Tap on the locked story you want to unlock</li>
                <li>Select "Select Payment Method" then "I already have an unlock code"</li>
                <li>Enter the code exactly as sent</li>
                <li>Tap "Unlock Story"</li>
                <li>Start reading immediately!</li>
              </ol>
            </div>
            <p className="text-sm text-gray-light/60">
              <strong className="text-white">Note:</strong> Each code is unique and tied to your name. If you lose your browser data, contact me to have your code reset so you can read your story again without paying twice!
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}