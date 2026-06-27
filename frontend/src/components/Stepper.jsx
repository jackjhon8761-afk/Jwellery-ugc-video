const STEPS = ['Photo', 'Generate', 'Pick a video', 'Caption', 'Publish'];

export default function Stepper({ current }) {
  return (
    <ol className="flex items-center w-full max-w-3xl mx-auto mb-8 px-1">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        return (
          <li key={label} className="flex-1 flex items-center last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-semibold border-2 transition-colors
                  ${
                    isDone
                      ? 'bg-gold-500 border-gold-500 text-white'
                      : isActive
                        ? 'border-gold-500 text-gold-700 bg-white'
                        : 'border-gray-300 text-gray-400 bg-white'
                  }`}
              >
                {isDone ? '✓' : stepNum}
              </div>
              <span
                className={`text-[10px] sm:text-xs whitespace-nowrap ${isActive ? 'text-gold-700 font-semibold' : 'text-gray-400'}`}
              >
                {label}
              </span>
            </div>
            {stepNum < STEPS.length && (
              <div className={`flex-1 h-0.5 mx-1 sm:mx-2 mb-4 ${isDone ? 'bg-gold-500' : 'bg-gray-200'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
