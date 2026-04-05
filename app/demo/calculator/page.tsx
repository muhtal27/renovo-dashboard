import type { Metadata } from "next";
import CalculatorClient from "./calculator-client";

export const metadata: Metadata = {
  title: "Savings Calculator | Renovo AI",
  description:
    "See how much your agency could save with Renovo AI end-of-tenancy automation.",
};

export default function CalculatorPage() {
  return <CalculatorClient />;
}
