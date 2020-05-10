import { expect } from 'expect/mod.ts'
import { camelCase } from 'case/mod.ts';

import { transformKeys } from '../transform-keys.ts';

Deno.it('transforms a flat object', () => {
  expect(
    transformKeys(
      {
        key: 'value',
        key_key: ['value', 'value'],
        key_key_key: 3,
      },
      camelCase,
    ),
  ).toEqual({
    key: 'value',
    keyKey: ['value', 'value'],
    keyKeyKey: 3,
  });
});

Deno.it('transforms a deep object', () => {
  expect(
    transformKeys(
      {
        key: {
          key_key: {
            key_key_key: 'value',
          },
        },
      },
      camelCase,
    ),
  ).toEqual({
    key: { keyKey: { keyKeyKey: 'value' } },
  });
});
