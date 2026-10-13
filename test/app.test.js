// -----------------------------------------------------------------------------
// End-to-end wiring checks against the SDK's in-memory Gladys: the handlers
// registered by `registerHandlers` are driven exactly like Gladys would, and
// the acks are the ones Gladys would receive.
// -----------------------------------------------------------------------------

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';

import { registerHandlers } from '../src/app.js';

const CONTACT = {
  messaging_service: 'whatsapp',
  phone_number: '+33612345678',
  api_key: 'secret-key',
};

// A fetch stub recording the requested URL and answering a canned page.
function fakeFetch(body = 'Message queued. You will receive it in a few seconds.') {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    return { ok: true, status: 200, text: async () => body };
  };
  return { fn, calls };
}

async function setup(fetchBody) {
  const { fn, calls } = fakeFetch(fetchBody);
  const gladys = createFakeGladys();
  registerHandlers(gladys, { fetchFn: fn });
  await gladys.connect();
  return { gladys, calls };
}

describe('registerHandlers', () => {
  test('reports the channel as connected once connected to Gladys', async () => {
    const { gladys } = await setup();
    assert.deepEqual(gladys.fake.connectionStatus, { connected: true });
    await gladys.disconnect();
  });

  test('acks a delivered notification with success', async () => {
    const { gladys, calls } = await setup();
    const ack = await gladys.fake.sendMessage(CONTACT, {
      text: 'The alarm was triggered!',
      file: null,
    });
    assert.equal(ack.success, true);
    assert.equal(calls.length, 1);
    assert.equal(new URL(calls[0]).searchParams.get('text'), 'The alarm was triggered!');
    await gladys.disconnect();
  });

  test('acks a refused notification with the CallMeBot error', async () => {
    const { gladys } = await setup('APIKey is invalid');
    const ack = await gladys.fake.sendMessage(CONTACT, { text: 'hi', file: null });
    assert.equal(ack.success, false);
    assert.match(ack.error, /Failed to send message: APIKey is invalid/);
    await gladys.disconnect();
  });

  test('shuts down gracefully', async () => {
    const { gladys } = await setup();
    await gladys.fake.shutdown('SIGTERM');
  });
});
