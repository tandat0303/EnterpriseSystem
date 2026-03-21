// create-form-button.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateFormButton() {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.push("/forms/create")}
      className="h-9 px-4 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg gap-1.5"
    >
      <Plus className="h-3.5 w-3.5" />
      Tạo biểu mẫu mới
    </Button>
  );
}
