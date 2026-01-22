import { useCallback, useRef } from "react";

// Ensure dataLayer type is available
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

interface GTMEventData {
  formId?: string;
  formName?: string;
  [key: string]: unknown;
}

/**
 * Hook for pushing GTM events with duplicate prevention
 */
export function useGTMEvent() {
  const pushedEventsRef = useRef<Set<string>>(new Set());

  const pushEvent = useCallback((eventName: string, eventData: GTMEventData = {}) => {
    if (typeof window === "undefined") return false;

    // Create unique key for this event
    const eventKey = `${eventName}_${eventData.formId || "default"}`;
    
    // Check if already pushed in this session
    if (pushedEventsRef.current.has(eventKey)) {
      console.log(`GTM Event already pushed: ${eventKey}`);
      return false;
    }

    // Initialize dataLayer if needed
    window.dataLayer = window.dataLayer || [];

    // Check if event already exists in dataLayer (additional safety)
    const alreadyInDataLayer = window.dataLayer.some(
      (item) => item.event === eventName && item.formId === eventData.formId
    );

    if (alreadyInDataLayer) {
      console.log(`GTM Event already in dataLayer: ${eventKey}`);
      return false;
    }

    // Push the event
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });

    // Mark as pushed
    pushedEventsRef.current.add(eventKey);
    
    console.log(`GTM Event pushed: ${eventName}`, eventData);
    return true;
  }, []);

  const resetEvents = useCallback(() => {
    pushedEventsRef.current.clear();
  }, []);

  return { pushEvent, resetEvents };
}

/**
 * Standalone function to push GTM event (for use outside React components)
 * Uses a module-level Set to track pushed events
 */
const pushedEvents = new Set<string>();

export function pushGTMEvent(eventName: string, eventData: GTMEventData = {}): boolean {
  if (typeof window === "undefined") return false;

  const eventKey = `${eventName}_${eventData.formId || "default"}`;
  
  if (pushedEvents.has(eventKey)) {
    console.log(`GTM Event already pushed: ${eventKey}`);
    return false;
  }

  window.dataLayer = window.dataLayer || [];

  const alreadyInDataLayer = window.dataLayer.some(
    (item) => item.event === eventName && item.formId === eventData.formId
  );

  if (alreadyInDataLayer) {
    console.log(`GTM Event already in dataLayer: ${eventKey}`);
    return false;
  }

  window.dataLayer.push({
    event: eventName,
    ...eventData,
  });

  pushedEvents.add(eventKey);
  console.log(`GTM Event pushed: ${eventName}`, eventData);
  return true;
}
