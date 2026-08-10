"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  Loader2,
  ShoppingBag,
  CheckCircle2
} from "lucide-react";
import { Story } from "@/types/story";
import { Button } from "./Button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CreateHardCopyOrderResponse } from "@/types/hardCopyOrder";

const MAX_QUANTITY = 20;
const HARD_COPY_BASE_FEE = 5500;

interface HardCopyOrderModalProps {
  open: boolean;
  story: Story;
  onClose: () => void;
}

function formatMwk(amount: number) {
  return `MWK ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(amount)}`;
}

function getHardCopyUnitPrice(onlinePriceMwk: number) {
  return onlinePriceMwk * 2 + HARD_COPY_BASE_FEE;
}

/**
 * Normalizes common Malawian WhatsApp formats into international format.
 *
 * Accepted examples:
 * 0991234567
 * 0881234567
 * +265991234567
 * +265881234567
 * 00265991234567
 * 265991234567
 * 991234567
 * 881234567
 */
function normalizeWhatsAppNumber(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Remove all non-digit characters except leading +
  let value = trimmed.replace(/[^\d+]/g, "");

  // If it starts with +, validate length and return
  if (value.startsWith("+")) {
    const digits = value.slice(1).replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) return null;
    return `+${digits}`;
  }

  // Extract all digits
  let digits = value.replace(/\D/g, "");

  // Handle 00 international prefix (e.g., 00265...)
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Handle Malawi local format with leading 0 (e.g., 0991234567, 0881234567, 0971234567)
  // Malawi local numbers are typically 10 digits with the leading 0
  if (digits.startsWith("0") && digits.length === 10) {
    return `+265${digits.slice(1)}`;
  }

  // Handle Malawi local format without leading 0 (e.g., 991234567, 881234567)
  // Typically 9 digits
  if (!digits.startsWith("0") && !digits.startsWith("265") && digits.length === 9) {
    return `+265${digits}`;
  }

  // Handle international format without + (e.g., 265991234567)
  if (digits.startsWith("265") && digits.length === 12) {
    return `+${digits}`;
  }

  // Fallback for general international numbers (9-15 digits)
  if (digits.length >= 9 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export default function HardCopyOrderModal({
  open,
  story,
  onClose
}: HardCopyOrderModalProps) {
  const [quantityValue, setQuantityValue] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [nameError, setNameError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successfulOrder, setSuccessfulOrder] =
    useState<CreateHardCopyOrderResponse | null>(null);

  useEffect(() => {
    setQuantityValue("1");
    setCustomerName("");
    setWhatsappNumber("");
    setNameError(null);
    setQuantityError(null);
    setPhoneError(null);
    setSuccessfulOrder(null);
  }, [story.id]);

  const parsedQuantity = Number.parseInt(quantityValue, 10);
  const quantityIsValid =
    Number.isInteger(parsedQuantity) &&
    parsedQuantity >= 1 &&
    parsedQuantity <= MAX_QUANTITY;

  const effectiveQuantity = quantityIsValid ? parsedQuantity : 1;

  const unitPrice = getHardCopyUnitPrice(story.price_mwk);
  const totalPrice = unitPrice * effectiveQuantity;

  const handleClose = () => {
    if (isSubmitting) return;

    if (successfulOrder) {
      setQuantityValue("1");
      setCustomerName("");
      setWhatsappNumber("");
      setNameError(null);
      setQuantityError(null);
      setPhoneError(null);
      setSuccessfulOrder(null);
    }

    onClose();
  };

  const decrementQuantity = () => {
    if (isSubmitting) return;

    const next = Math.max(1, Math.min(MAX_QUANTITY, effectiveQuantity - 1));
    setQuantityValue(String(next));
    setQuantityError(null);
  };

  const incrementQuantity = () => {
    if (isSubmitting) return;

    const next = Math.min(MAX_QUANTITY, effectiveQuantity + 1);
    setQuantityValue(String(next));
    setQuantityError(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const trimmedName = customerName.trim();

    if (!trimmedName) {
      setNameError("Please enter your name.");
      return;
    }

    if (trimmedName.length > 100) {
      setNameError("Your name must be 100 characters or fewer.");
      return;
    }

    if (!quantityIsValid) {
      setQuantityError(`Enter a whole number between 1 and ${MAX_QUANTITY}.`);
      return;
    }

    const normalizedPhone = normalizeWhatsAppNumber(whatsappNumber);

    if (!normalizedPhone) {
      setPhoneError(
        "Enter a valid WhatsApp number, e.g. 0991234567 or +265991234567."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc("create_hard_copy_order", {
        p_story_id: story.id,
        p_customer_name: trimmedName,
        p_whatsapp_number: normalizedPhone,
        p_quantity: parsedQuantity
      });

      if (error) {
        console.error("Hard copy order failed:", error);
        toast.error(error.message || "Unable to place order. Please try again.");
        return;
      }

      const result = data as CreateHardCopyOrderResponse | null;

      if (!result) {
        toast.error("Unable to place order. Please try again.");
        return;
      }

      setSuccessfulOrder(result);
    } catch (error) {
      console.error("Hard copy order failed:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="hard-copy-order-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            key="hard-copy-order-modal"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-4"
          >
            <div className="w-full sm:max-w-md bg-navy border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Order Hard Copy</h3>

                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  aria-label="Close order form"
                  className="p-2 rounded-full hover:bg-white/10 text-gray-light/70 disabled:opacity-40"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {successfulOrder ? (
                  <div className="text-center space-y-4 py-4">
                    <CheckCircle2 className="mx-auto text-brand" size={52} />

                    <h4 className="text-xl font-bold text-white">
                      Order Received
                    </h4>

                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-gray-light/80">
                      <p className="font-semibold text-white">{story.title}</p>
                      <p className="mt-1">
                        {successfulOrder.quantity}{" "}
                        {successfulOrder.quantity === 1 ? "copy" : "copies"}
                      </p>
                      <p className="mt-2 font-bold text-white">
                        {formatMwk(successfulOrder.total_price_mwk)}
                      </p>
                    </div>

                    <p className="text-sm text-gray-light/70">
                      Your order has been received. We will contact you on
                      WhatsApp to confirm the order and delivery details.
                    </p>

                    <Button
                      variant="primary"
                      className="w-full justify-center"
                      onClick={handleClose}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Story summary */}
                    <div className="flex gap-4 rounded-2xl border border-white/5 bg-white/5 p-3 mb-5">
                      <img
                        src={story.cover_image}
                        alt={`Cover of ${story.title}`}
                        className="w-14 aspect-[3/4] rounded-lg object-cover border border-white/10"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white line-clamp-2">
                          {story.title}
                        </p>
                        <p className="text-xs text-gray-light/60 mt-0.5">
                          Physical copy
                        </p>
                        <p className="text-sm font-bold text-brand mt-1">
                          {formatMwk(unitPrice)} per copy
                        </p>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="mb-5">
                      <label
                        htmlFor="hard-copy-quantity"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-light/70"
                      >
                        Quantity
                      </label>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={decrementQuantity}
                          disabled={effectiveQuantity <= 1 || isSubmitting}
                          aria-label="Decrease quantity"
                          className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-light hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus size={16} />
                        </button>

                        <input
                          id="hard-copy-quantity"
                          inputMode="numeric"
                          autoComplete="off"
                          value={quantityValue}
                          onChange={(e) => {
                            setQuantityValue(
                              e.target.value.replace(/[^0-9]/g, "")
                            );
                            setQuantityError(null);
                          }}
                          aria-label="Quantity"
                          className="w-16 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />

                        <button
                          type="button"
                          onClick={incrementQuantity}
                          disabled={
                            effectiveQuantity >= MAX_QUANTITY || isSubmitting
                          }
                          aria-label="Increase quantity"
                          className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-light hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {quantityError ? (
                        <p className="mt-1 text-xs text-red-400">
                          {quantityError}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-light/50">
                          Maximum {MAX_QUANTITY} copies per order.
                        </p>
                      )}
                    </div>

                    {/* Price summary */}
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 mb-5 space-y-2">
                      <div className="flex items-center justify-between text-sm text-gray-light/70">
                        <span>Price per copy</span>
                        <span>{formatMwk(unitPrice)}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-light/70">
                        <span>Quantity</span>
                        <span>{effectiveQuantity}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm font-bold text-white pt-1 border-t border-white/5">
                        <span>Total</span>
                        <span>{formatMwk(totalPrice)}</span>
                      </div>
                    </div>

                    {/* Customer details */}
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="hard-copy-name"
                          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-light/70"
                        >
                          Your name
                        </label>

                        <input
                          id="hard-copy-name"
                          value={customerName}
                          maxLength={120}
                          autoComplete="name"
                          placeholder="e.g. Chisomo Banda"
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            setNameError(null);
                          }}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-light/40 focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />

                        {nameError && (
                          <p className="mt-1 text-xs text-red-400">{nameError}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="hard-copy-whatsapp"
                          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-light/70"
                        >
                          WhatsApp number
                        </label>

                        <input
                          id="hard-copy-whatsapp"
                          value={whatsappNumber}
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="0991234567 or +265991234567"
                          onChange={(e) => {
                            setWhatsappNumber(e.target.value);
                            setPhoneError(null);
                          }}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-light/40 focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />

                        {phoneError ? (
                          <p className="mt-1 text-xs text-red-400">{phoneError}</p>
                        ) : (
                          <p className="mt-1 text-xs text-gray-light/50">
                            We will use this number to contact you about the
                            order.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 space-y-2">
                      <Button
                        variant="primary"
                        className="w-full justify-center gap-2"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={18} />
                            Place Order
                          </>
                        )}
                      </Button>

                      <Button
                        variant="secondary"
                        className="w-full justify-center"
                        onClick={handleClose}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}