// -----------------------------------------------------------------------------
// Wiring of the integration on a Gladys client.
//
// Kept apart from `index.js` so the tests can run it against the SDK's fake
// Gladys (`createFakeGladys` from `@gladysassistant/integration-sdk/testing`).
// -----------------------------------------------------------------------------

import { logger as defaultLogger } from '@gladysassistant/integration-sdk';
import { sendMessage } from './callmebot.js';

/**
 * Register every handler on `gladys`. `fetchFn` and `logger` let the tests
 * replace the CallMeBot HTTP call and the SDK logger.
 */
export function registerHandlers(gladys, { fetchFn, logger = defaultLogger } = {}) {
  // --- Outgoing notification: deliver through the CallMeBot API --------------
  // `contact` = the target user's contact_schema values ({ messaging_service,
  // phone_number, api_key }); users without configured credentials are skipped
  // by Gladys and never reach this handler. Throwing acks success:false.
  gladys.onSendMessage(async (contact, message) => {
    await sendMessage(contact, message, { fetchFn });
  });

  // --- Connection lifecycle --------------------------------------------------
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

  // --- Graceful shutdown -----------------------------------------------------
  gladys.handleShutdown((signal) => {
    logger.info(`Received ${signal} -> graceful shutdown`);
  });
}
