"use client"
import PercentageModal from "@/components/common/PercentageModal";
import { SavingContext, SavingProvider } from "@/components/common/SavingContext";
import Header from "@/components/layout/Header";
import React from "react";

export default function Home() {
  return (
    <SavingProvider>
      <Header />
      <PercentageModal />
    </SavingProvider>
  );
}
