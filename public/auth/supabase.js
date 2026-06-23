import { createClient } from "./supabase-vendor.js";

export const supabase = createClient(
  "https://qewmhaualndadheoaxkm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFld21oYXVhbG5kYWRoZW9heGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDM3ODQsImV4cCI6MjA5NTcxOTc4NH0.go23TjvFYLJmUAxIZYU0fEqtHmUjJA3GVS0Ecu94k4E"
);
