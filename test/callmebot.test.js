import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildMessageUrl, sendMessage, SUPPORTED_SERVICES } from '../src/callmebot.js';

const CONTACT = {
  messaging_service: 'whatsapp',
  phone_number: '+33612345678',
  api_key: 'secret-key',
};

// A fetch stub recording the requested URL and answering a canned page.
function fakeFetch({
  status = 200,
  body = 'Message queued. You will receive it in a few seconds.',
} = {}) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    return { ok: status >= 200 && status < 300, status, text: async () => body };
  };
  return { fn, calls };
}

describe('buildMessageUrl', () => {
  test('builds the WhatsApp endpoint URL', () => {
    const url = new URL(
      buildMessageUrl({
        messagingService: 'whatsapp',
        phoneNumber: '+33612345678',
        apiKey: 'secret-key',
        text: 'Hello from Gladys!',
      }),
    );
    assert.equal(url.origin, 'https://api.callmebot.com');
    assert.equal(url.pathname, '/whatsapp.php');
    assert.equal(url.searchParams.get('phone'), '+33612345678');
    assert.equal(url.searchParams.get('text'), 'Hello from Gladys!');
    assert.equal(url.searchParams.get('apikey'), 'secret-key');
  });

  test('builds the Signal endpoint URL', () => {
    const url = new URL(
      buildMessageUrl({
        messagingService: 'signal',
        phoneNumber: '+33612345678',
        apiKey: 'secret-key',
        text: 'hello',
      }),
    );
    assert.equal(url.pathname, '/signal/send.php');
  });

  test('is case-insensitive on the service name', () => {
    const url = buildMessageUrl({
      messagingService: 'WhatsApp',
      phoneNumber: '+33612345678',
      apiKey: 'k',
      text: 't',
    });
    assert.match(url, /whatsapp\.php/);
  });

  test('percent-encodes the message text', () => {
    const url = buildMessageUrl({
      messagingService: 'whatsapp',
      phoneNumber: '+33612345678',
      apiKey: 'k',
      text: 'Température: 21°C & humidité 40%',
    });
    const params = new URL(url).searchParams;
    assert.equal(params.get('text'), 'Température: 21°C & humidité 40%');
    assert.ok(!url.includes('°'), 'raw non-ASCII characters must not leak into the URL');
  });

  test('throws on an unsupported messaging service', () => {
    assert.throws(
      () =>
        buildMessageUrl({ messagingService: 'telegram', phoneNumber: 'p', apiKey: 'k', text: 't' }),
      /Unsupported messaging service: telegram/,
    );
  });
});

describe('sendMessage', () => {
  test('delivers when CallMeBot answers "Message queued"', async () => {
    const { fn, calls } = fakeFetch();
    await sendMessage(CONTACT, { text: 'The alarm was triggered!', file: null }, { fetchFn: fn });
    assert.equal(calls.length, 1);
    const params = new URL(calls[0]).searchParams;
    assert.equal(params.get('text'), 'The alarm was triggered!');
    assert.equal(params.get('apikey'), 'secret-key');
  });

  test('supports every service declared in SUPPORTED_SERVICES', async () => {
    for (const service of SUPPORTED_SERVICES) {
      const { fn, calls } = fakeFetch();
      await sendMessage(
        { ...CONTACT, messaging_service: service },
        { text: 'hi', file: null },
        { fetchFn: fn },
      );
      assert.equal(calls.length, 1, `service ${service} should perform a request`);
    }
  });

  test('throws when the response does not confirm the delivery', async () => {
    const { fn } = fakeFetch({ body: 'APIKey is invalid' });
    await assert.rejects(
      sendMessage(CONTACT, { text: 'hi', file: null }, { fetchFn: fn }),
      /Failed to send message: APIKey is invalid/,
    );
  });

  test('throws on an HTTP error status', async () => {
    const { fn } = fakeFetch({ status: 503, body: 'Service Unavailable' });
    await assert.rejects(
      sendMessage(CONTACT, { text: 'hi', file: null }, { fetchFn: fn }),
      /Failed to send message/,
    );
  });

  test('throws when the contact configuration is incomplete', async () => {
    const { fn, calls } = fakeFetch();
    for (const missing of ['messaging_service', 'phone_number', 'api_key']) {
      await assert.rejects(
        sendMessage({ ...CONTACT, [missing]: '' }, { text: 'hi', file: null }, { fetchFn: fn }),
        /configuration is incomplete/,
      );
    }
    assert.equal(calls.length, 0, 'no request must leave with an incomplete configuration');
  });
});
