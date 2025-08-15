"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    } else if (user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  return null;
}