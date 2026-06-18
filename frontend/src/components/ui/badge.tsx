import { HTMLAttributes } from "react";

const tones = {
  slate: "bg-slate-100 text-slate-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  brand: "bg-brand-100 text-brand-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof tones;
}

export function Badge({ tone = "slate", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tones[tone]} ${className}`}
      {...props}
    />
  );
}