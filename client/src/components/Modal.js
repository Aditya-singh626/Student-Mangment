import React, { useEffect } from "react";

export default function Modal({ title, subtitle, onClose, children, wide }) {
    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-panel ${wide ? "modal-panel-wide" : ""}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">{title}</h3>
                        {subtitle && <div className="modal-subtitle">{subtitle}</div>}
                    </div>
                    <button className="modal-close" onClick={onClose} type="button">
                        ✕
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}