import React from "react";
import { HeaderSection } from "../components/HeaderSection";
import { LogoSection } from "../components/LogoSection";
import { MainContentSection } from "../components/MainContentSection";

export default function Login(): React.JSX.Element {
  return (
    <div className="flex flex-col h-[1564px] items-center justify-center gap-[68px] relative bg-coolgray-10">
      <HeaderSection />
      <MainContentSection />
      <LogoSection />
    </div>
  );
}