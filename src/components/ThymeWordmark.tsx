import type { HTMLAttributes } from "react";

export function ThymeWordmark({
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`thyme-wordmark inline-flex items-center gap-[0.32em] ${className}`} {...props}>
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="size-[1.05em] shrink-0 text-[#71835b]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 25.5C13.1 20.5 17.6 15.2 23.7 6.5" strokeWidth="2.1" />
        <path d="M11.4 22.2C6.8 22.9 4.8 20 5.2 16.8c3.4-.5 6.1.9 6.2 4.4" fill="currentColor" strokeWidth="1.35" />
        <path d="M16.1 17.3c-4.2-.2-5.5-3-4.5-5.8 3.2.2 5.4 2.3 4.5 5.8" fill="currentColor" strokeWidth="1.35" />
        <path d="M19.9 12.2c-.8-3.8 1.4-5.8 4.4-5.7.8 3.1-.3 5.8-3.8 6.2" fill="currentColor" strokeWidth="1.35" />
        <path d="M10.1 24.7c1.7 1.8 4 2.5 6.1 2.2" strokeWidth="1.7" />
      </svg>
      <span>thyme<span className="text-[#e55b5b]">.</span></span>
    </span>
  );
}
