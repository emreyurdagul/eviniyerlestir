interface SearchBoxProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  testId?: string
}

export default function SearchBox({
  value, onChange, placeholder = 'Ara...', className = '', testId,
}: SearchBoxProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none">
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-7 pr-7 py-1.5 text-[11px] bg-white border border-stone-300/50 rounded-lg text-stone-800 placeholder-stone-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300/40"
        data-testid={testId}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer w-5 h-5 flex items-center justify-center leading-none rounded-full hover:bg-stone-100"
          aria-label="Temizle"
          data-testid={testId ? `${testId}-clear` : undefined}
        >✕</button>
      )}
    </div>
  )
}
