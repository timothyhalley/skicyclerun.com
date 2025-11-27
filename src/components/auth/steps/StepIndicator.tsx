export function StepIndicator({
  isVerificationStep,
  isLoginStep,
}: {
  isVerificationStep: boolean;
  isLoginStep: boolean;
}) {
  if (!isVerificationStep && !isLoginStep) return null;

  return (
    <>
      {isVerificationStep && (
        <div className="pl-auth__step-indicator --verification">
          <svg
            className="pl-auth__step-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <div className="pl-auth__step-text">
            <strong>Step 1 of 2:</strong> Verify your account
          </div>
        </div>
      )}

      {isLoginStep && (
        <div className="pl-auth__step-indicator --login">
          <svg
            className="pl-auth__step-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <div className="pl-auth__step-text">
            <strong>Step 2 of 2:</strong> Sign in to your account
          </div>
        </div>
      )}
    </>
  );
}
