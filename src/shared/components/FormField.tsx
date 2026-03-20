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
  const baseClass = 'w-full px-3 py-2.5 sm:py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 transition-colors';

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-slate-600">
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
          className={`${baseClass} min-h-[100px]`}
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
