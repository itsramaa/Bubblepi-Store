interface TimelineStep {
  label: string;
  timestamp: string | null;
  completed: boolean;
  current: boolean;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                step.completed
                  ? 'border-green-500 bg-green-50 dark:bg-green-900'
                  : step.current
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
              }`}
            >
              {step.completed ? (
                <span className="text-green-600 dark:text-green-400">✓</span>
              ) : (
                <span className="text-gray-400">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-600" />
            )}
          </div>
          <div className="pt-1">
            <p
              className={`font-medium ${
                step.completed
                  ? 'text-green-700 dark:text-green-300'
                  : step.current
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-500'
              }`}
            >
              {step.label}
            </p>
            {step.timestamp && (
              <p className="text-sm text-muted-foreground">
                {new Date(step.timestamp).toLocaleString('id-ID')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
