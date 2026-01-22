import { useEffect, useCallback } from "react";

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
}

const UTM_STORAGE_KEY = "comparecv_utm_params";

/**
 * Hook to capture and store UTM parameters from URL
 * Captures on mount and stores in sessionStorage for persistence during navigation
 */
export function useUTMTracking() {
  useEffect(() => {
    // Only capture if we don't already have stored params
    const existing = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (existing) return;

    const urlParams = new URLSearchParams(window.location.search);
    
    const params: UTMParams = {
      utm_source: urlParams.get("utm_source") || undefined,
      utm_medium: urlParams.get("utm_medium") || undefined,
      utm_campaign: urlParams.get("utm_campaign") || undefined,
      utm_content: urlParams.get("utm_content") || undefined,
      utm_term: urlParams.get("utm_term") || undefined,
      referrer: document.referrer || undefined,
    };

    // Only store if we have at least one param
    const hasParams = Object.values(params).some(v => v !== undefined);
    if (hasParams) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
    }
  }, []);

  const getUTMParams = useCallback((): UTMParams => {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }, []);

  return { getUTMParams };
}

/**
 * Standalone function to get stored UTM params (for use outside React components)
 */
export function getStoredUTMParams(): UTMParams {
  const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}
