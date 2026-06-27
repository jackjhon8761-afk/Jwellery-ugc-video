export default function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin" />
      {label && <span className="text-gray-600 text-sm">{label}</span>}
    </div>
  );
}

export function InlineSpinner() {
  return <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />;
}
