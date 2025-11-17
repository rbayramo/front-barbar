import React, { useState } from "react";

const COUNTRIES = [
  { code: "AZ", label: "Azerbaijan", dial: "+994", digits: 9 },
  { code: "TR", label: "Turkey", dial: "+90", digits: 10 }
];

export default function PhoneInput({ value, onChange, country, onCountryChange }) {
  const [open, setOpen] = useState(false);
  const current =
    COUNTRIES.find((c) => c.code === country) || COUNTRIES.find((c) => c.code === "AZ");

  function handleNumberChange(e) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, current.digits);
    onChange(digits);
  }

  return (
    <div className="phone-input">
      <button
        type="button"
        className="phone-country"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{current.dial}</span>
        <span className="chevron">▾</span>
      </button>
      <input
        className="phone-number"
        placeholder={current.digits === 9 ? "50 123 45 67" : ""}
        value={value}
        onChange={handleNumberChange}
      />
      {open && (
        <div className="phone-country-menu">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className="phone-country-item"
              onClick={() => {
                onCountryChange(c.code, c.dial, c.digits);
                setOpen(false);
              }}
            >
              {c.label} ({c.dial})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
