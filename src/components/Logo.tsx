import { Terminal } from "lucide-react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] shadow-[0_0_15px_var(--accent)] shadow-[var(--accent)]/30 shrink-0">
        <Terminal className="h-5 w-5 text-white" />
      </div>
      {showText && (
        <h1 className="text-xl font-bold tracking-tight text-[var(--text)] whitespace-nowrap">Linux Monitor</h1>
      )}
    </Link>
  );
}
