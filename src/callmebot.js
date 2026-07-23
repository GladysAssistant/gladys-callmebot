// -----------------------------------------------------------------------------
// CallMeBot "driver": builds the API URL and delivers one message.
//
// CallMeBot (https://www.callmebot.com) is a free notification gateway: the
// user activates it once per messaging service (WhatsApp or Signal), gets a
// personal API key, and messages are then sent with a single HTTP GET.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';

const logger = createLogger({ name: 'callmebot' });

const API_BASE_URL = 'https://api.callmebot.com';

// One entry per supported messaging service -> the API endpoint path.
const SERVICE_ENDPOINTS = {
  whatsapp: '/whatsapp.php',
  signal: '/signal/send.php',
};

export const SUPPORTED_SERVICES = Object.keys(SERVICE_ENDPOINTS);

// Delivery must fit inside the Gladys command acknowledgement window.
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Build the CallMeBot request URL for one message.
 * Throws on an unsupported messaging service.
 */
export function buildMessageUrl({ messagingService, phoneNumber, apiKey, text }) {
  const endpoint = SERVICE_ENDPOINTS[String(messagingService ?? '').toLowerCase()];
  if (!endpoint) {
    throw new Error(`Unsupported messaging service: ${messagingService}`);
  }
  const params = new URLSearchParams({ phone: phoneNumber, text, apikey: apiKey });
  return `${API_BASE_URL}${endpoint}?${params.toString()}`;
}

/**
 * Deliver one Gladys message to the contact's messaging service.
 *
 * `contact` carries the target user's `contact_schema` values, resolved by
 * Gladys: { messaging_service, phone_number, api_key }. Throwing makes the SDK
 * ack the delivery with success:false, so Gladys sees the failure.
 */
export async function sendMessage(contact, message, { fetchFn = fetch } = {}) {
  const {
    messaging_service: messagingService,
    phone_number: phoneNumber,
    api_key: apiKey,
  } = contact;

  if (!messagingService || !phoneNumber || !apiKey) {
    throw new Error(
      'CallMeBot configuration is incomplete: service, phone number and API key are all required',
    );
  }

  const url = buildMessageUrl({ messagingService, phoneNumber, apiKey, text: message.text });

  logger.debug(`Sending a ${messagingService} message to ${phoneNumber}`);
  const response = await fetchFn(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const body = await response.text();

  // CallMeBot answers 200 with an HTML page; only "Message queued" in the body
  // confirms the message was accepted (errors also come back as 200 pages).
  if (!response.ok || !body.toLowerCase().includes('message queued')) {
    throw new Error(`Failed to send message: ${body.slice(0, 200)}`);
  }

  logger.debug('CallMeBot message sent successfully');
}
