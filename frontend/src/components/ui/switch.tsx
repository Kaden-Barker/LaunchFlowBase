import React from "react";

interface CustomSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  label?: string;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
  checked,
  onChange,
  id,
  label,
}) => (
  <label className="flex items-center cursor-pointer">
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={`block w-9 h-5 rounded-full border border-gray-400 transition-colors duration-200 ${
          checked ? "bg-black" : "bg-white"
        }`}
      ></div>
      <div
        className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow ${
          checked ? "translate-x-4" : ""
        }`}
      ></div>
    </div>
    {label && (
      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
    )}
  </label>
);