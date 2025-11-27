export const dialogStyles = `
.pl-auth__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
  backdrop-filter: blur(6px);
}
.pl-auth__backdrop.--open {
  display: flex;
}
.pl-auth__dialog {
  position: relative;
  background: var(--color-surface, #0f172a);
  color: var(--color-text, #f8fafc);
  width: min(420px, 100%);
  border-radius: 18px;
  padding: 1.75rem 1.75rem 2rem;
  box-shadow: 0 25px 70px rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(248, 250, 252, 0.12);
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}
.pl-auth__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
}
.pl-auth__title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
}
.pl-auth__subtitle {
  margin: 0 0 1.25rem 0;
  font-size: 0.95rem;
  color: rgba(248, 250, 252, 0.75);
}
.pl-auth__status {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  background: rgba(14, 165, 233, 0.1);
  color: rgba(125, 211, 252, 0.95);
  border: 1px solid rgba(125, 211, 252, 0.4);
}
.pl-auth__status.--error {
  background: rgba(248, 113, 113, 0.1);
  color: rgba(252, 165, 165, 0.95);
  border: 1px solid rgba(252, 165, 165, 0.35);
}
.pl-auth__status.--success {
  background: rgba(134, 239, 172, 0.08);
  color: rgba(187, 247, 208, 0.95);
  border: 1px solid rgba(34, 197, 94, 0.35);
}
.pl-auth__step-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 2px solid;
  animation: slideIn 0.3s ease-out;
}
.pl-auth__step-indicator.--verification {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
  border-color: rgba(251, 191, 36, 0.4);
  color: rgba(253, 224, 71, 0.95);
}
.pl-auth__step-indicator.--login {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
  border-color: rgba(34, 197, 94, 0.4);
  color: rgba(187, 247, 208, 0.95);
}
.pl-auth__step-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}
.pl-auth__step-text {
  font-size: 0.9rem;
  line-height: 1.4;
}
.pl-auth__step-text strong {
  display: block;
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 0.15rem;
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.pl-auth__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.pl-auth__method-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.pl-auth__method-button {
  flex: 1;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.35);
  color: rgba(248, 250, 252, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 0.6rem 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease,
    border-color 0.2s ease, box-shadow 0.2s ease;
}
.pl-auth__method-button.--active {
  background: rgba(99, 102, 241, 0.9);
  border-color: rgba(99, 102, 241, 0.9);
  color: #0f172a;
  box-shadow: 0 12px 28px rgba(99, 102, 241, 0.3);
}
.pl-auth__method-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}
.pl-auth__hint {
  margin: -0.1rem 0 0.35rem;
  font-size: 0.82rem;
  color: rgba(248, 250, 252, 0.6);
}
.pl-auth__label {
  font-size: 0.85rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(248, 250, 252, 0.6);
}
.pl-auth__input {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.65);
  color: inherit;
  padding: 0.85rem 1rem;
  font-size: 1rem;
}
.pl-auth__input.--code {
  letter-spacing: 0.6em;
  text-align: center;
  font-weight: 600;
}
.pl-auth__input:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
  outline-offset: 2px;
}
.pl-auth__button {
  border-radius: 999px;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.pl-auth__button.--primary {
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  color: #0f172a;
  box-shadow: 0 15px 30px rgba(99, 102, 241, 0.35);
}
.pl-auth__button.--primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}
.pl-auth__button.--ghost {
  background: transparent;
  color: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.35);
}
.pl-auth__button.--ghost:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .pl-auth__dialog {
    padding: 1.5rem 1.25rem 1.75rem;
  }
}
`;
