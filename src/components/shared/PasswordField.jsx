import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  focusColor = 'navy',
  uppercaseLabel = false,
}) {
  const [visible, setVisible] = useState(false)

  const focusClasses =
    focusColor === 'red'
      ? 'focus:border-[#E8323C] focus:ring-2 focus:ring-[#E8323C]/15'
      : 'focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/20'

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className={
            uppercaseLabel
              ? 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600'
              : 'mb-1.5 block text-sm font-medium text-navy'
          }
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-[#0D1B2A] outline-none transition-all duration-150 placeholder:text-slate-400 focus:outline-none ${focusClasses}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0D1B2A]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
