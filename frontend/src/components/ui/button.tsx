import { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
}

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}