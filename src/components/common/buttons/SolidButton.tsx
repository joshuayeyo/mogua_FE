import { twMerge } from "tailwind-merge";
import { type SolidButtonProps } from "@/types/button";

export default function SolidButton({
  variant = "primary",
  size = "large",
  state = "default",
  mode = "default",
  children,
  className = "",
  ...props
}: SolidButtonProps) {
  const variantStyles = {
    primary: {
      large: "h-14 text-body-1-normal px-2.5 gap-2.5 font-semibold rounded-2xl",
      small:
        "h-10 rounded-[6px] px-2.5 py-2 gap-1 text-label-normal font-medium",
    },
    secondary: {
      large:
        "h-[54px] text-body-2-normal px-4 gap-2.5 font-semibold rounded-2xl",
      small:
        "h-[38px] rounded-[6px] px-4 gap-1 text-body-2-normal font-semibold",
    },
  }[variant][size];

  const stateStyles = {
    default:
      mode === "special"
        ? "bg-gray-700 border-gray-700 text-gray-200"
        : "bg-gray-800 border-gray-800 text-gray-200",
    activated: "bg-orange-300 border-orange-300 text-gray-50",
    inactive: "bg-gray-800 border-gray-800 text-gray-500 cursor-not-allowed",
  }[state];

  const finalStyle = twMerge(
    `btn-base ${variantStyles} ${stateStyles} ${className}`,
  );

  return (
    <button className={finalStyle} disabled={state === "inactive"} {...props}>
      {children}
    </button>
  );
}
