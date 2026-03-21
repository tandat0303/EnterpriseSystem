"use client";

import type React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("relative", className)} {...props}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <Input
        id="search"
        placeholder="Tìm kiếm..."
        className="pl-9 pr-4 h-9 text-[13px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
      />
    </form>
  );
}
