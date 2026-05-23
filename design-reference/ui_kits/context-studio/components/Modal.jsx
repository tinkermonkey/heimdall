// Heimdall — primitive · Modal
// Generic content modal. Composes: ModalHead + body + ModalFoot (mono-hint + actions).
// Anatomy spec: preview/component-modal.html

function Modal({ onClose, width, children, ariaLabel }) {
  // Esc to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={width ? { width } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHead({ title, subtitle, eyebrow }) {
  return (
    <div className="modal-head">
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
      {title && <div className="title">{title}</div>}
      {subtitle && <div className="sub">{subtitle}</div>}
    </div>
  );
}

function ModalBody({ children }) {
  return <div className="modal-body">{children}</div>;
}

function ModalFoot({ hint, children }) {
  return (
    <div className="modal-foot">
      {hint && <span className="modal-foot-hint">{hint}</span>}
      {children}
    </div>
  );
}

Object.assign(window, { Modal, ModalHead, ModalBody, ModalFoot });
