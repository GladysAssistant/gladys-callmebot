// -----------------------------------------------------------------------------
// Consistency checks between `gladys-assistant-integration.json` and the code.
// The manifest is validated by the store indexer, but nothing there can know
// which contact keys the delivery code actually reads — these tests keep both
// in sync.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { SUPPORTED_SERVICES } from '../src/callmebot.js';

const manifest = JSON.parse(
  await readFile(new URL('../gladys-assistant-integration.json', import.meta.url), 'utf8'),
);
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('the manifest declares a send-only communication channel', () => {
  assert.equal(manifest.type, 'communication');
  assert.deepEqual(manifest.messaging, { receive: false });
});

test('the contact_schema matches the keys the delivery code reads', () => {
  const keys = manifest.contact_schema.map((f) => f.key);
  assert.deepEqual(keys.sort(), ['api_key', 'messaging_service', 'phone_number']);
  for (const field of manifest.contact_schema) {
    assert.equal(field.required, true, `contact field "${field.key}" must be required`);
  }
});

test('the API key is stored as a secret', () => {
  const apiKey = manifest.contact_schema.find((f) => f.key === 'api_key');
  assert.equal(apiKey.type, 'secret');
});

test('the messaging_service options match the services the code supports', () => {
  const field = manifest.contact_schema.find((f) => f.key === 'messaging_service');
  assert.equal(field.type, 'select');
  const values = field.options.map((o) => o.value);
  assert.deepEqual(values.sort(), [...SUPPORTED_SERVICES].sort());
  assert.ok(values.includes(field.default), 'the default must be one of the options');
});

test('manifest version and docker image stay in lockstep with package.json', () => {
  assert.equal(manifest.version, pkg.version);
  assert.ok(
    manifest.docker_image.endsWith(`:${manifest.version}`),
    'the docker_image tag must match the manifest version',
  );
});

test('section fields are purely presentational', () => {
  for (const section of manifest.config_schema.filter((f) => f.type === 'section')) {
    assert.equal(section.required, undefined, `section "${section.key}" must not be required`);
    assert.equal(section.default, undefined, `section "${section.key}" must not have a default`);
    assert.ok(section.label?.en, `section "${section.key}" needs an English label`);
    for (const link of section.links ?? []) {
      assert.match(link.url, /^https:\/\//, 'section links must be https');
    }
  }
});
