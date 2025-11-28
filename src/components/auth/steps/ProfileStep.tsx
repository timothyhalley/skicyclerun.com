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
      <div className="pl-auth__hint pl-auth__profile-hint">
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
      <div className="pl-auth__hint pl-auth__field-hint">
        Include country code (e.g., +1 for US/Canada)
      </div>

      <label className="pl-auth__label" htmlFor="profile-location">
        Location (optional)
      </label>
      <div className="pl-auth__location-wrapper">
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
        <div className="pl-auth__hint pl-auth__field-hint">
          Format: Country / State (e.g., USA / WA, Canada / BC, Japan)
        </div>
        {!profileLocation && (
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={loading || locationDetecting}
            className="pl-auth__button --ghost pl-auth__detect-button"
          >
            {locationDetecting ? "Detecting..." : "📍 Auto-detect location"}
          </button>
        )}
      </div>

      <div className="pl-auth__button-group">
        <button
          type="button"
          onClick={onSkip}
          className="pl-auth__button --ghost"
          disabled={loading}
        >
          Skip
        </button>
        <button
          type="submit"
          className="pl-auth__button --primary"
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </form>
  );
}
