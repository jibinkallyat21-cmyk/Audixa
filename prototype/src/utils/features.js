// Switches that turn whole conveniences on or off without removing their code.
// DEMO_DATA: the demo client, demo files, "use demo data" buttons and sample document fillers. Off by default (real client files only).
// To bring the demo back, set VITE_DEMO_DATA=on (in Vercel's environment variables, or .env.local for a local run) and rebuild. Nothing else changes.
export const DEMO_DATA = import.meta.env.VITE_DEMO_DATA === 'on'
