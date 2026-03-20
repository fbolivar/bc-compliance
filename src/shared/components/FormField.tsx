interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

export function FormField({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  defaultValue,
  options,
  rows,
  min,
  max,
  step,
}: FormFieldProps) {
  const baseClass = 'w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors';

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {type === 'select' && options ? (
        <select
          id={name}
          name={name}
          required={required}
          defaultValue={defaultValue as string}
          className={baseClass}
        >
          <option value="">Seleccionar...</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue as string}
          rows={rows || 3}
          className={baseClass}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          min={min}
          max={max}
          step={step}
          className={baseClass}
        />
      )}
    </div>
  );
}
