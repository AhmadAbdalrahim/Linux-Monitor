"use client";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AddUserModal } from "@/components/AddUserModal";
import { useRouter } from "next/navigation";

export default function AdminUserHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleAdded = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold italic tracking-tight uppercase">Manage Users</h1>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 font-bold text-[var(--accent-text)] shadow-lg shadow-[var(--accent)]/20 transition-all hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <AddUserModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onAdded={handleAdded} 
      />
    </>
  );
}
