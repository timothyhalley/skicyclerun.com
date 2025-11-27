import type { FormEvent } from "react";
import {
  formatLocationForDisplay,
  parseLocationFromDisplay,
} from "@utils/geolocation";

interface ProfileStepProps {
  profilePhone: string;
  profileLocation: string;
  locationDetecting: boolean;
  loading: boolean;
  onPhoneChange: (phone: string) => void;
  onLocationChange: (location: string) => void;
  onDetectLocation: () => Promise<void>;
  onSkip: () => Promise<void>;
  onComplete: (event?: FormEvent) => Promise<void>;
}

export function ProfileStep({
  profilePhone,
  profileLocation,
  locationDetecting,
  loading,
  onPhoneChange,
  onLocationChange,
  onDetectLocation,
  onSkip,
  onComplete,
}: ProfileStepProps) {
  return (
    <form className="pl-auth__form" onSubmit={onComplete}>
      <div className="pl-auth__hint" style={{ marginBottom: "1rem" }}>
        These fields are optional. You can skip this step or fill them in later.
      </div>

      <label className="pl-auth__label" htmlFor="profile-phone">
        Phone number (optional)
      </label>
      <input
        id="profile-phone"
        type="tel"
        value={profilePhone}
        onChange={(event) => onPhoneChange(event.target.value)}
        placeholder="+1 555 123 4567 or (555) 123-4567"
        className="pl-auth__input"
        autoComplete="tel"
        disabled={loading}
      />
      <div
        className="pl-auth__hint"
        style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}
      >
        Include country code (e.g., +1 for US/Canada)
      </div>

      <label className="pl-auth__label" htmlFor="profile-location">
        Location (optional)
      </label>
      <div style={{ position: "relative" }}>
        <input
          id="profile-location"
          type="text"
          value={
            profileLocation ? formatLocationForDisplay(profileLocation) : ""
          }
          onChange={(event) => {
            const parsed = parseLocationFromDisplay(event.target.value);
            onLocationChange(parsed);
          }}
          placeholder="USA / WA or Canada / BC"
          className="pl-auth__input"
          disabled={loading || locationDetecting}
        />
        <div
          className="pl-auth__hint"
          style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}
        >
          Format: Country / State (e.g., USA / WA, Canada / BC, Japan)
        </div>
        {!profileLocation && (
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={loading || locationDetecting}
            className="pl-auth__button --ghost"
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              padding: "0.5rem 0.75rem",
            }}
          >
            {locationDetecting ? "Detecting..." : "📍 Auto-detect location"}
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginTop: "1.5rem",
        }}
      >
        <button
          type="button"
          onClick={onSkip}
          className="pl-auth__button --ghost"
          disabled={loading}
          style={{ flex: 1 }}
        >
          Skip
        </button>
        <button
          type="submit"
          className="pl-auth__button --primary"
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </form>
  );
}
