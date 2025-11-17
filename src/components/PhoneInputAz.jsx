import React from "react";

export default function PhoneInputAz({
  value,
  onChange,
  required = false,
  id,
  name
}) {
  // Always treat incoming value as digits only (no +994 here)
  const digits = (value || "").replace(/\D/g, "").slice(0, 9);

  function handleChange(e) {
    const newDigits = e.target.value.replace(/\D/g, "").slice(0, 9);
    if (onChange) {
      onChange(newDigits);
    }
  }

  return (
    <div className="phone-input-row">
      <select
        className="phone-country-select"
        value="+994"
        onChange={() => {}}
      >
        <option value="+994">Azərbaycan (+994)</option>
      </select>
      <input
        id={id}
        name={name}
        className="phone-number-input"
        type="tel"
        value={digits}
        onChange={handleChange}
        required={required}
        placeholder="(__) ___ __ __"
      />
    </div>
  );
}
