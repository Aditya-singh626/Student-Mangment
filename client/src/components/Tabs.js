import React from "react";

export default function Tabs({ tabs, active, onChange }) {
    return (
        <div className="dash-tabs">
            {tabs.map((t) => (
                <button
                    key={t.key}
                    className={`dash-tab ${active === t.key ? "active" : ""}`}
                    onClick={() => onChange(t.key)}
                    type="button"
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}