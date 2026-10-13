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
import { registerHandlers } from './src/app.js';

const gladys = new GladysIntegration();
registerHandlers(gladys);

// --- Startup -----------------------------------------------------------------
logger.info('Starting the CallMeBot integration...');
gladys.connect().catch((err) => {
  logger.error('Initial connection failed', err);
  process.exit(1);
});
