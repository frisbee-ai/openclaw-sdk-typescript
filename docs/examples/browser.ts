/**
 * Browser Usage Example
 *
 * Example showing how to use the SDK in a browser environment.
 * The SDK automatically detects the browser environment and uses
 * the native WebSocket API.
 *
 * This example uses ES modules directly in the browser.
 */

// NOTE: For browser usage, you'll need to use a bundler like
// esbuild, webpack, or vite to bundle the SDK.

import { createClient } from "openclaw-sdk";

// ============================================================================
// Basic Browser Example
// ============================================================================

async function browserExample() {
  const client = createClient({
    url: "wss://gateway.openclaw.example.com",
    credentials: {
      deviceId: "browser-device-id",
      apiKey: "browser-api-key",
    },
  });

  try {
    await client.connect();
    console.log("✓ Connected in browser");

    // Listen to events
    client.on("agent.status", (event) => {
      console.log("Agent status:", event.payload);
    });

    // Make a request
    const result = await client.request("agents.list", {});
    console.log("Agents:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

// ============================================================================
// Browser Example with UI Integration
// ============================================================================

function setupUIIntegration() {
  const connectBtn = document.getElementById("connect-btn") as HTMLButtonElement;
  const disconnectBtn = document.getElementById("disconnect-btn") as HTMLButtonElement;
  const statusDiv = document.getElementById("status") as HTMLDivElement;
  const eventsDiv = document.getElementById("events") as HTMLDivElement;

  const client = createClient({
    url: "wss://gateway.openclaw.example.com",
    credentials: {
      deviceId: "ui-device-id",
      apiKey: "ui-api-key",
    },
  });

  // Update connection state
  client.on("connectionStateChange", (state) => {
    statusDiv.textContent = `Status: ${state}`;
    statusDiv.className = state === "ready" ? "connected" : "disconnected";
  });

  // Display incoming events
  client.on("*", (event) => {
    const eventEl = document.createElement("div");
    eventEl.className = "event";
    eventEl.textContent = `[${event.type}] ${JSON.stringify(event.payload)}`;
    eventsDiv.prepend(eventEl);
  });

  // Connect button
  connectBtn.addEventListener("click", async () => {
    try {
      await client.connect();
    } catch (error) {
      console.error("Connection failed:", error);
    }
  });

  // Disconnect button
  disconnectBtn.addEventListener("click", () => {
    client.disconnect();
  });
}

// ============================================================================
// HTML Example
// ============================================================================

/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OpenClaw SDK Browser Example</title>
  <style>
    .connected { color: green; }
    .disconnected { color: red; }
    #events { max-height: 300px; overflow-y: auto; }
    .event { padding: 4px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <h1>OpenClaw SDK Browser Example</h1>

  <div>
    <button id="connect-btn">Connect</button>
    <button id="disconnect-btn">Disconnect</button>
  </div>

  <div id="status">Status: disconnected</div>

  <h2>Events</h2>
  <div id="events"></div>

  <script type="module" src="./browser-example.js"></script>
</body>
</html>
*/

// Auto-setup on load
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", setupUIIntegration);
}

export { browserExample, setupUIIntegration };
