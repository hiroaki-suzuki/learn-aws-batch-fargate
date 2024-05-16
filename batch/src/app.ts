import { parseArgs } from 'node:util';

const args = process.argv.slice(2);
const options = {
  bucketName: {
    type: 'string',
    multiple: false,
  },
  objectKey: {
    type: 'string',
    multiple: false,
  },
} as const;
const { values } = parseArgs({ options, args });

console.log(values);
