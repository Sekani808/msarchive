// src/app/search/page.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Lock, 
  CreditCard, 
  CheckCircle, 
  KeyRound,
  AlertCircle,
  ChevronDown,
  MessageCircle,
  ShoppingBag,
  Heart,
  HelpCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

// Custom WhatsApp Icon Component (Official Logo)
const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

export default function HelpPage() {
  const { settings, fetchSettings } = useSettingsStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  const formatWhatsAppLink = () => {
    const number = settings?.whatsapp_number?.replace(/[^0-9]/g, '') || '265980720991';
    return `https://wa.me/${number}`;
  };

  const quickActions = [
    { id: 'buy', label: 'Buy a Story', icon: BookOpen, href: '#purchase-flow' },
    { id: 'pay', label: 'Payment Methods', icon: CreditCard, href: '#payment-methods' },
    { id: 'interact', label: 'Like, Rate & Comment', icon: MessageCircle, href: '#interactions' },
    { id: 'hardcopy', label: 'Order a Hard Copy', icon: ShoppingBag, href: '#hard-copy' },
    { id: 'unlock', label: 'I Have a Code', icon: KeyRound, href: '#unlock-code' },
    { id: 'contact', label: 'Contact WhatsApp', icon: HelpCircle, href: '#whatsapp-support' },
  ];

  const purchaseSteps = [
    { title: "Browse the Library", desc: "Explore free and premium stories." },
    { title: "Choose a Premium Story", desc: "Premium stories display a price/lock indicator. Select the story to begin the unlock process." },
    { title: "Choose a Payment Method", desc: "Choose one of the supported payment methods below." },
    { title: "Complete Payment", desc: "Use the displayed banking or mobile-money instructions." },
    { title: "Send Payment Proof", desc: "Take a screenshot of the payment confirmation and send it through WhatsApp." },
    { title: "Receive Your Unlock Code", desc: "After payment verification, you will receive a unique unlock code." },
    { title: "Unlock and Read", desc: "Enter the code in the story unlock interface and start reading." },
  ];

  const paymentMethods = [
    { name: "Mo626", subtitle: "National Bank", code: "*626#", image: "/assets/images/payments/mo626.png" },
    { name: "*247#", subtitle: "Standard Bank", code: "*247#", image: "/assets/images/payments/247.png" },
    { name: "Airtel Money", subtitle: "Mobile Money", code: "*211#", image: "/assets/images/payments/airtel-money.png" },
    { name: "Mpamba", subtitle: "TNM Mobile Money", code: "*444#", image: "/assets/images/payments/mpamba.jpg" },
  ];

  const whatsappSteps = [
    "Take a screenshot of the payment confirmation.",
    "Send it to the Msarchive WhatsApp number.",
    "Include the story title.",
    "Include your full name.",
    "If ordering a hard copy, include the quantity and delivery details.",
    "Wait for payment verification.",
    "Receive your unlock code.",
  ];

  const unlockSteps = [
    "Open the premium story.",
    "Choose the unlock-code option.",
    "Enter the code exactly as received.",
    "Tap Unlock Story.",
    "Start reading.",
  ];

  const faqs = [
    { q: "How do I buy a premium story?", a: "Browse the library, select a premium story, choose a payment method, and send your payment screenshot via WhatsApp for verification." },
    { q: "Which payment methods are supported?", a: "We support Mo626 (National Bank), Standard Bank (*247#), Airtel Money (*211#), and Mpamba TNM (*444#)." },
    { q: "Where do I send my payment screenshot?", a: "Send your screenshot, along with the story title and your full name, to the official Msarchive WhatsApp number." },
    { q: "How do I like a story?", a: "Tap the heart icon on any story card or in the story details screen to add your like." },
    { q: "How do I rate a story?", a: "Open the story details, complete the story, then use the rating option to choose your stars." },
    { q: "How can I leave a comment?", a: "After completing and rating a story, open the story details and submit your comment with your name." },
    { q: "How do I order a hard copy?", a: "Open the story details and choose 'Order Hard Copy'. Enter your name, WhatsApp number, quantity, and submit the request." },
    { q: "What happens after I receive my unlock code?", a: "Enter the code in the story's unlock interface to instantly gain access to the full text." },
    { q: "What if my story does not unlock?", a: "Ensure you entered the code exactly as received. If it still fails, contact us on WhatsApp for assistance." },
    { q: "What if I lose my unlock code?", a: "Contact us on WhatsApp with your name and story title, and we will help you regain access without paying twice." },
    { q: "Are the free stories really free?", a: "Yes, free stories are completely free to read and do not require payment or an unlock code." },
    { q: "How do I sign out?", a: "Open the Reading dashboard and click the 'Logout' button in the header — you'll be returned to the homepage." },
    { q: "Why do videos play behind sign-in or sign-up cards?", a: "Short looping background videos are used for atmosphere on the sign in and sign up pages; they are muted and optimized for performance and accessibility." },
  ];

  const WhatsAppButton = () => (
    <a 
      href={formatWhatsAppLink()} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full font-semibold transition-all active:scale-95 shadow-lg shadow-green-500/20"
      aria-label="Contact Msarchive on WhatsApp (opens in new tab)"
    >
      <WhatsAppIcon size={18} />
      Contact on WhatsApp
    </a>
  );

  return (
    <main className="min-h-screen px-5 sm:px-8 pt-12 pb-32 max-w-3xl mx-auto">
      
      {/* 1. Header */}
      <motion.header 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center">
            <HelpCircle className="text-brand" size={22} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Help & Support</h1>
        </div>
        <p className="text-gray-light/70 text-base leading-relaxed">
          Everything you need to browse, buy, unlock and read stories.
        </p>
      </motion.header>

      {/* 2. Quick Actions */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-light/50 uppercase tracking-wider mb-3">
          What do you need help with?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.id}
                href={action.href}
                className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-white/10 transition-colors active:scale-95"
              >
                <Icon className="text-brand flex-shrink-0" size={20} />
                <span className="text-sm font-medium text-white">{action.label}</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* 3. Main Purchase Flow */}
      <section id="purchase-flow" className="mb-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-white mb-6">How to Unlock a Story</h2>
        <div className="relative pl-12 border-l-2 border-brand/20 space-y-6">
          {purchaseSteps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <div className="absolute -left-16 w-8 h-8 rounded-full bg-navy-dark border-2 border-brand flex items-center justify-center text-xs font-bold text-brand">
                {index + 1}
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{step.title}</h3>
              <p className="text-sm text-gray-light/70 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Payment Methods */}
      <section id="payment-methods" className="mb-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-white mb-1">Payment Methods</h2>
        <p className="text-sm text-gray-light/60 mb-5">Choose any of the supported payment options below.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl p-4 flex items-center gap-4"
            >
              <img 
                src={method.image} 
                alt={`${method.name} logo`}
                className="w-12 h-12 object-contain rounded-lg bg-white/5 p-1 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white truncate">{method.name}</h3>
                <p className="text-xs text-gray-light/60 truncate">{method.subtitle}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-mono font-bold text-brand">{method.code}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Interact with Stories */}
      <section id="interactions" className="mb-12 scroll-mt-20">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center">
              <Heart className="text-brand" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Like, Rate, and Comment</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Like a Story</h3>
              <p className="text-sm text-gray-light/70 leading-relaxed">
                Tap the heart icon on the story card or inside the story details screen to add your like.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Rate a Story</h3>
              <p className="text-sm text-gray-light/70 leading-relaxed">
                Finish the story first, then use the rating option in the story details modal to choose your stars.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Leave a Comment</h3>
              <p className="text-sm text-gray-light/70 leading-relaxed">
                After you complete and rate the story, submit your comment with your name in the story details screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Order a Hard Copy */}
      <section id="hard-copy" className="mb-12 scroll-mt-20">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent-purple/15 flex items-center justify-center">
              <ShoppingBag className="text-accent-purple" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Order a Hard Copy</h2>
          </div>

          <p className="text-sm text-gray-light/80 mb-4">
            You can order a physical copy from the story details screen. The order form collects your name, WhatsApp number, and quantity.
          </p>

          <ol className="space-y-2 mb-4">
            <li className="flex items-start gap-3 text-sm text-gray-light/70">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-bold flex items-center justify-center mt-0.5">1</span>
              <span>Open the story details and tap "Order Hard Copy".</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-light/70">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-bold flex items-center justify-center mt-0.5">2</span>
              <span>Enter your name, WhatsApp number, and how many copies you want.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-light/70">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              <span>Submit the order and wait for a WhatsApp confirmation with delivery details.</span>
            </li>
          </ol>

          <p className="text-sm text-gray-light/70">
            Hard copy prices are based on the story price plus a standard printing and delivery fee. You will be contacted on WhatsApp to finalize your order.
          </p>
        </div>
      </section>

      {/* 7. WhatsApp Payment Verification */}
      <section id="whatsapp-support" className="mb-12 scroll-mt-20">
        <div className="glass rounded-2xl p-6 border border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
              <WhatsAppIcon size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Paid? Send Your Screenshot</h2>
          </div>
          
          <p className="text-sm text-gray-light/80 mb-4">
            After completing payment, please follow these steps:
          </p>
          
          <ol className="space-y-2 mb-6">
            {whatsappSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-light/70">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand/20 text-brand text-xs font-bold flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <WhatsAppButton />
        </div>
      </section>

      {/* 8. Unlock Code Section */}
      <section id="unlock-code" className="mb-12 scroll-mt-20">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center">
              <KeyRound className="text-accent-purple" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">I Have an Unlock Code</h2>
          </div>
          
          <p className="text-sm text-gray-light/80 mb-4">
            If you have already received your code, follow these steps to start reading:
          </p>
          
          <ol className="space-y-2">
            {unlockSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-light/70">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-bold flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="mb-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-white mb-5">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                aria-expanded={openFaq === index}
                aria-controls={`faq-${index}`}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                <ChevronDown className={`text-gray-light/50 flex-shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} size={18} />
              </button>
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div
                    id={`faq-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-sm text-gray-light/70 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Final Support CTA */}
      <section className="mb-8">
        <div className="glass rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Still need help?</h2>
          <p className="text-sm text-gray-light/70 mb-5 max-w-sm mx-auto">
            Contact Msarchive on WhatsApp and include your story title and payment details.
          </p>
          <WhatsAppButton />
        </div>
      </section>

    </main>
  );
}