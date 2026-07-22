"use client"

import { Check } from "lucide-react"

interface Props {
  currentStep: number
}

const steps = ["Data Pembeli", "Konfirmasi", "Pembayaran"]

export default function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((label, i) => {
        const step = i + 1
        const active = step === currentStep
        const done = step < currentStep
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`relative w-9 h-9 rounded-full flex items-center justify-center text-body-sm font-bold transition-all duration-300 ${
                  done
                    ? "bg-ink text-on-dark"
                    : active
                    ? "bg-ink text-on-dark"
                    : "bg-surface-strong text-muted"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-ink/20" />
                )}
                {done ? <Check className="h-4 w-4" /> : <span>{step}</span>}
              </div>
              <span
                className={`hidden sm:block text-caption-sm mt-1.5 font-medium transition-colors ${
                  active || done ? "text-ink" : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>

            {/* connecting line — hairline */}
            {i < steps.length - 1 && (
              <div className="relative h-px w-14 mx-1 mb-5 bg-hairline">
                <div
                  className="absolute inset-0 bg-ink transition-all duration-500 ease-out"
                  style={{ width: done ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}