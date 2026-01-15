import { createClient } from '@supabase/supabase-js';

const CENTRAL_HUB_URL = 'https://pijbrphradettztsguqd.supabase.co';
const CENTRAL_HUB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpamJycGhyYWRldHR6dHNndXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDY4MTQsImV4cCI6MjA4MzgyMjgxNH0.vC0-3EYYjpiX-uymkDhPIEZoMLcWZ7oMASatPm79nGs';

export const centralHubClient = createClient(CENTRAL_HUB_URL, CENTRAL_HUB_ANON_KEY);

// Tool source identifier
export const TOOL_SOURCE = 'compare-cv';

// Map employee range to number
export const employeeRangeToNumber: Record<string, number> = {
  '1-10': 10,
  '11-50': 50,
  '51-200': 200,
  '201-500': 500,
  '500+': 501,
};
