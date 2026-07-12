interface Props {
  currentStep: number
}

const steps = ["Data Pembeli", "Konfirmasi", "Pembayaran"]

export default function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const step = i + 1
        const active = step === currentStep
        const done = step < currentStep
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done
                    ? "bg-primary text-white"
                    : active
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? "✓" : step}
              </div>
              <span className="text-xs mt-1 text-muted-foreground">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-12 mb-5 mx-1 ${done ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
