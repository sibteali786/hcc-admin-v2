"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/store";
import MailingComp from "@/components/mailingComp";

function MailingPage() {
  const isUserLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isUserLoggedIn) {
      router.push("/login");
    }
  }, [isUserLoggedIn, hasHydrated, router]);

  return (
    <main>
      <MailingComp />
    </main>
  );
}

export default MailingPage;
