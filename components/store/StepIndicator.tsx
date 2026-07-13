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
                className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  done
                    ? "bg-primary text-primary-foreground shadow-md"
                    : active
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/25 shadow-lg"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {/* pulse animation on active step */}
                {active && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                )}
                {done ? <Check className="h-4 w-4" /> : <span>{step}</span>}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium transition-colors ${
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>

            {/* connecting line */}
            {i < steps.length - 1 && (
              <div className="relative h-0.5 w-14 mx-1 mb-5 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-0 bg-primary transition-all duration-500 ease-out rounded-full"
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
