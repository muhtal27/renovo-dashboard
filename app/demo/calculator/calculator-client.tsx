"use client";

import { useState } from "react";
import Link from "next/link";

const fmt = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function getPlan(volume: number): { name: string; price: number } {
  if (volume >= 3500) return { name: "Enterprise", price: 15 };
  if (volume >= 2000) return { name: "Enterprise", price: 18 };
  if (volume >= 1000) return { name: "Growth", price: 21 };
  return { name: "Pay As You Go", price: 29 };
}

export default function CalculatorClient() {
  const [volume, setVolume] = useState(1000);

  const rawManualCostPerCheckout = 149 - ((volume / 300) - 1) * 1.5;
  const manualCostPerCheckout = Math.max(140, Math.min(149, rawManualCostPerCheckout));
  const manualAnnualCost = volume * manualCostPerCheckout;

  const { name: planName, price: planPrice } = getPlan(volume);
  const renovoAnnualCost = volume * planPrice;
  const annualSaving = manualAnnualCost - renovoAnnualCost;
  const threeYearSaving = annualSaving * 3;
  const fteFreed = volume / 300;

  const pct = ((volume - 100) / (5000 - 100)) * 100;

  return (
    <main className="min-h-screen bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Savings Calculator
          </h1>
          <p className="mt-3 text-lg text-zinc-500">
            See how much your agency could save with Renovo&nbsp;AI.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left — Slider */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <label
              htmlFor="volume"
              className="block text-sm font-medium text-zinc-500"
            >
              Annual checkout volume
            </label>
            <p className="mt-1 text-4xl font-bold text-zinc-950">
              {volume.toLocaleString("en-GB")}
            </p>

            <input
              id="volume"
              type="range"
              min={100}
              max={5000}
              step={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 outline-none
                [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-md
                [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-emerald-500"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${pct}%, #e4e4e7 ${pct}%, #e4e4e7 100%)`,
              }}
            />

            <div className="mt-2 flex justify-between text-xs text-zinc-400">
              <span>100</span>
              <span>5,000</span>
            </div>
          </div>

          {/* Centre — Annual saving */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 text-center">
            <p className="text-sm font-medium text-zinc-500">
              Estimated annual saving
            </p>
            <p className="mt-2 text-5xl font-bold text-emerald-500">
              {fmt.format(annualSaving)}
            </p>
            <span className="mt-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-600">
              {planName}
            </span>
          </div>

          {/* Right — Breakdown */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-medium text-zinc-500">Breakdown</h2>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Manual cost</span>
                <span className="text-sm font-semibold text-zinc-950">
                  {fmt.format(manualAnnualCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Renovo AI cost</span>
                <span className="text-sm font-semibold text-zinc-950">
                  {fmt.format(renovoAnnualCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">FTE freed</span>
                <span className="text-sm font-semibold text-zinc-950">
                  {fteFreed.toFixed(1)}
                </span>
              </div>
              <div className="border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-950">
                    3-year saving
                  </span>
                  <span className="text-lg font-bold text-emerald-500">
                    {fmt.format(threeYearSaving)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-zinc-400">
                For a full breakdown, ask for our pricing brochure.
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/demo"
            className="inline-block rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            Book a demo
          </Link>
        </div>

        {/* Footnote */}
        <p className="mt-8 text-center text-xs text-zinc-400">
          Estimates based on industry benchmarks. Actual savings depend on your
          staffing model and case mix.
        </p>
      </div>
    </main>
  );
}
