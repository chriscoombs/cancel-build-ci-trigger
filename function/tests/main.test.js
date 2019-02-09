/* global test expect */
const {
  match,
  getPathFilters,
  isInPathFilters,
} = require('../src/main');

test('Append to file name', () => {
  expect(match([
    'include/include.js1',
  ],
  [
    'include/include.js/**/*',
  ])).toEqual([]);
});

test('Direct match', () => {
  expect(match([
    'include/include.js/include',
  ],
  [
    'include/include.js/**/*',
  ])).toEqual(['include/include.js/include']);
});

test('Path filter appended with /', () => {
  expect(match([
    'include/include.js1',
  ],
  [
    'include//**/*',
  ])).toEqual(['include/include.js1']);
});

test('Direct exclude', () => {
  expect(match([
    'include/include/include.js',
    'include/include/exclude.js',
  ],
  [
    'include//**/*',
    '!include/include/exclude.js',
  ])).toEqual(['include/include/include.js']);
});

test('Exclude all and include specific', () => {
  expect(match([
    'include/include/include.js',
    'include/include/exclude.js',
  ],
  [
    '!/**/*',
    'include//**/*',
    '!include/include/exclude.js',
  ])).toEqual(['include/include/include.js']);
});

test('Match all', () => {
  expect(match([
    'include/include/include.js',
  ],
  [
    '**/*',
  ])).toEqual(['include/include/include.js']);
});

test('Real match', () => {
  expect(match([
    'cloudformation/dynamodb.template.json',
  ],
  [
    'cloudformation/**/*',
  ])).toEqual(['cloudformation/dynamodb.template.json']);
});

test('Map includes and excludes', () => {
  expect(getPathFilters({
    pathFilters: [
      '+/include',
      '-/exclude',
    ],
  })).toEqual([
    'include/**/*',
    '!/exclude/**/*',
  ]);
});

test('Real match', () => {
  expect(isInPathFilters([
    'cloudformation/dynamodb.template.json',
  ], {
    triggers: [
      {
        triggerType: 2,
        pathFilters: [
          '+cloudformation',
        ],
      },
    ],
  })).toEqual(true);
});

test('Real mismatch', () => {
  expect(isInPathFilters([
    'cloudformation/dynamodb.template.json',
  ], {
    triggers: [
      {
        triggerType: 2,
        pathFilters: [
          '+include',
        ],
      },
    ],
  })).toEqual(false);
});

test('No path filters', () => {
  expect(getPathFilters({})).toEqual([
    '**/*',
  ]);
});
