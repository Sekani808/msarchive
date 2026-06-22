// src/components/ui/Button.tsx
import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function Button({ 
  children, 
  variant = "primary", 
  className = "", 
  ...props 
}: ButtonProps) {
  
  // Base styles: Chunky, bold, rounded, and ready for 3D effect
  const baseStyles = "relative px-8 py-3.5 rounded-2xl font-extrabold text-sm tracking-wide transition-all duration-100 flex items-center justify-center gap-2 select-none active:translate-y-1";
  
  const variants = {
    // Primary: Bright green with a darker green 3D bottom edge
    primary: "bg-brand text-navy-dark border-b-4 border-b-[#5a9e2f] active:border-b-0 active:mt-1 shadow-[0_4px_0_#5a9e2f] active:shadow-none",
    // Secondary: Dark navy with a black 3D bottom edge
    secondary: "bg-navy text-white border-b-4 border-b-black active:border-b-0 active:mt-1 shadow-[0_4px_0_#000000] active:shadow-none"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92, y: 2 }} // More pronounced press effect
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}