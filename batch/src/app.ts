import { parseArgs } from 'node:util';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import path from 'node:path';
import * as fs from 'node:fs';

type Status = 'START' | 'SUCCESS' | 'FAILED';

interface LogInfo {
  status: Status;
  bucketName: string;
  objectKey: string;
  execTime: number;
}

(async function main() {
  const start = process.hrtime();

  const logInfo: LogInfo = {
    status: 'START',
    bucketName: '',
    objectKey: '',
    execTime: 0,
  };

  try {
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

    if (values.objectKey && values.objectKey.endsWith('/')) {
      return;
    }

    logInfo.bucketName = values.bucketName!;
    logInfo.objectKey = values.objectKey!;

    const client = new S3Client({ region: 'ap-northeast-1' });
    const getCommand = new GetObjectCommand({
      Bucket: logInfo.bucketName,
      Key: logInfo.objectKey,
    });

    const response = await client.send(getCommand);

    const filename = path.basename(logInfo.objectKey);
    const filePath = `/tmp/processed-${filename}`;
    await response.Body?.transformToWebStream().pipeTo(
      new WritableStream({
        write(chunk) {
          const decoder = new TextDecoder();
          fs.writeFileSync(filePath, decoder.decode(chunk));
        },
      }),
    );

    const putCommand = new PutObjectCommand({
      Bucket: logInfo.bucketName,
      Key: `processed/processed-${filename}`,
      Body: fs.createReadStream(filePath),
    });
    await client.send(putCommand);

    logInfo.status = 'SUCCESS';
  } catch (e) {
    console.error(e);
    logInfo.status = 'FAILED';
  }

  const execTime = process.hrtime(start);
  logInfo.execTime = execTime[0] + execTime[1] / 1e9;

  console.log(JSON.stringify(logInfo));
})();
