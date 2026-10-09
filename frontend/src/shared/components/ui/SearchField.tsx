interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Nombre accesible; si falta se usa el placeholder. */
  label?: string
}

/**
 * Buscador con lupa de las barras de herramientas.
 *
 * El marco es el <label>, no el input: así la lupa queda adentro, el
 * anillo de foco rodea a los dos (`:focus-within`) y tocar la lupa
 * enfoca el campo.
 */
export function SearchField({ value, onChange, placeholder, label }: SearchFieldProps) {
  return (
    <label className="search-field">
      <svg
        className="search-field__icon"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m14 14 4 4" strokeLinecap="round" />
      </svg>
      <input
        className="search-input"
        type="search"
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
