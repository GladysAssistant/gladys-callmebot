// -----------------------------------------------------------------------------
// Entry point of the CallMeBot external integration for Gladys Assistant.
//
// This is a send-only communication channel (manifest `type: "communication"`,
// `messaging: { receive: false }`): Gladys resolves the target user's
// credentials from the manifest `contact_schema` and hands them to
// `onSendMessage` with every outgoing notification. There is no incoming path,
// no device and no polling — the whole integration is the delivery handler.
//
// Environment variables provided by the Gladys supervisor to the container:
//   - GLADYS_HOST_API_URL         (host API URL)
//   - GLADYS_INTEGRATION_TOKEN    (integration-scoped JWT)
//   - GLADYS_INTEGRATION_SELECTOR (integration identifier)
// The SDK reads them automatically: `new GladysIntegration()` is enough.
// -----------------------------------------------------------------------------

import { GladysIntegration, logger } from '@gladysassistant/integration-sdk';
import { sendMessage } from './src/callmebot.js';

const gladys = new GladysIntegration();

// --- Outgoing notification: deliver through the CallMeBot API ----------------
// `contact` = the target user's contact_schema values ({ messaging_service,
// phone_number, api_key }); users without configured credentials are skipped
// by Gladys and never reach this handler. Throwing acks success:false.
gladys.onSendMessage(async (contact, message) => {
  await sendMessage(contact, message);
});

// --- Connection lifecycle ----------------------------------------------------
// The SDK logs the WebSocket lifecycle itself (under the `gladys-sdk` name).
// CallMeBot has no session to open: once connected to Gladys, the channel is
// operational, so report the application-level status right away.
gladys.on('connected', async () => {
  try {
    await gladys.setConnectionStatus(true);
  } catch (err) {
    logger.error('Failed to report the connection status', err);
  }
});

// --- Graceful shutdown -------------------------------------------------------
gladys.handleShutdown((signal) => {
  logger.info(`Received ${signal} -> graceful shutdown`);
});

// --- Startup -----------------------------------------------------------------
logger.info('Starting the CallMeBot integration...');
gladys.connect().catch((err) => {
  logger.error('Initial connection failed', err);
  process.exit(1);
});
