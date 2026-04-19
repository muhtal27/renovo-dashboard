"use client";

import { useState } from "react";
import Link from "next/link";

const fmt = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const BLOCK_SIZE = 365;
const BLOCK_PRICE = 179;

function getBlocks(tenancies: number): number {
  return Math.max(1, Math.ceil(tenancies / BLOCK_SIZE));
}

export default function CalculatorClient() {
  const [tenancies, setTenancies] = useState(365);

  const blocks = getBlocks(tenancies);
  const isEnterprise = blocks > 5;
  const monthlyCost = blocks * BLOCK_PRICE;
  const annualCost = monthlyCost * 12;

  // Manual cost estimate: ~£140–149 per checkout, averaging ~2 checkouts per tenancy/year
  const checkoutsPerYear = tenancies * 2;
  const rawManualCostPerCheckout = 149 - ((checkoutsPerYear / 300) - 1) * 1.5;
  const manualCostPerCheckout = Math.max(140, Math.min(149, rawManualCostPerCheckout));
  const manualAnnualCost = checkoutsPerYear * manualCostPerCheckout;

  const annualSaving = manualAnnualCost - annualCost;
  const threeYearSaving = annualSaving * 3;
  const fteFreed = checkoutsPerYear / 300;

  const pct = ((tenancies - 50) / (2000 - 50)) * 100;

  return (
    <main className="min-h-screen bg-white/[0.03] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Savings Calculator
          </h1>
          <p className="mt-3 text-lg text-white/55">
            See how much your agency could save with Renovo&nbsp;AI.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left — Slider */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <label
              htmlFor="tenancies"
              className="block text-sm font-medium text-white/55"
            >
              Fully managed tenancies
            </label>
            <p className="mt-1 text-4xl font-bold text-white">
              {tenancies.toLocaleString("en-GB")}
            </p>

            <input
              id="tenancies"
              type="range"
              min={50}
              max={2000}
              step={50}
              value={tenancies}
              onChange={(e) => setTenancies(Number(e.target.value))}
              className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 outline-none
                [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-md
                [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-emerald-500"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${pct}%, #e4e4e7 ${pct}%, #e4e4e7 100%)`,
              }}
            />

            <div className="mt-2 flex justify-between text-xs text-white/40">
              <span>50</span>
              <span>2,000</span>
            </div>
          </div>

          {/* Centre — Annual saving */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="text-sm font-medium text-white/55">
              Estimated annual saving
            </p>
            <p className="mt-2 text-5xl font-bold text-emerald-500">
              {isEnterprise ? "Custom" : fmt.format(annualSaving)}
            </p>
            <span className="mt-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-600">
              {isEnterprise
                ? "Enterprise"
                : `${blocks} ${blocks === 1 ? "block" : "blocks"} · ${fmt.format(monthlyCost)}/mo`}
            </span>
          </div>

          {/* Right — Breakdown */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-sm font-medium text-white/55">Breakdown</h2>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/65">Manual cost (est.)</span>
                <span className="text-sm font-semibold text-white">
                  {fmt.format(manualAnnualCost)}/yr
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/65">Renovo AI cost</span>
                <span className="text-sm font-semibold text-white">
                  {isEnterprise ? "Custom" : `${fmt.format(annualCost)}/yr`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/65">Portfolio blocks</span>
                <span className="text-sm font-semibold text-white">
                  {isEnterprise ? "6+" : blocks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/65">FTE freed</span>
                <span className="text-sm font-semibold text-white">
                  {fteFreed.toFixed(1)}
                </span>
              </div>
              {!isEnterprise && (
                <div className="border-t border-white/[0.06] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      3-year saving
                    </span>
                    <span className="text-lg font-bold text-emerald-500">
                      {fmt.format(threeYearSaving)}
                    </span>
                  </div>
                </div>
              )}
              <div className="text-xs text-white/40">
                Let-only tenancies included at no extra cost.
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/book-demo"
            className="inline-block rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            Book a demo
          </Link>
        </div>

        {/* Footnote */}
        <p className="mt-8 text-center text-xs text-white/40">
          Estimates based on industry benchmarks. Actual savings depend on your
          staffing model and case mix. First month on us for new customers.
        </p>
      </div>
    </main>
  );
}
