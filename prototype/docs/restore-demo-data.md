# Bringing the demo data back

The demo code is still in the app; it is only switched off.

1. In `prototype/.env.production` add the line `VITE_DEMO_DATA=on` (or set it in the Vercel project's environment variables) and rebuild or redeploy.
2. The client dashboard card then offers "Demo files" or "My own client files", the tools show their "Use demo data" or "Use the client's data" buttons, the sample document fillers return, and tools fill themselves when opened for a demo client.
3. To switch it off again remove the line (or set it to anything other than `on`).

Prompt to give Claude when you want it back:

> Bring back the demo data option. It is behind VITE_DEMO_DATA in prototype/src/utils/features.js. Set VITE_DEMO_DATA=on in prototype/.env.production, rebuild, and check that the client dashboard offers Demo files and My own client files, the tools show their demo buttons again, a real client file still works with demo off, and the tests pass. Do not delete or rewrite any demo code.
