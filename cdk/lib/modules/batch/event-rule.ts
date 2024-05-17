import { Construct } from 'constructs';
import { EnvValues } from '../env/env-values';
import { EventField, Rule, RuleTargetInput } from 'aws-cdk-lib/aws-events';
import { Bucket } from 'aws-cdk-lib/aws-s3';

import { EcsJobDefinition, JobQueue } from 'aws-cdk-lib/aws-batch';
import { BatchJob } from 'aws-cdk-lib/aws-events-targets';
import { Duration } from 'aws-cdk-lib';
import { Queue } from 'aws-cdk-lib/aws-sqs';

export class EventProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
  readonly bucket: Bucket;
  readonly jobQueue: JobQueue;
  readonly jobDefinition: EcsJobDefinition;
  readonly deadLetterQueue: Queue;
}

export class EventRule extends Construct {
  constructor(scope: Construct, id: string, props: EventProps) {
    super(scope, id);

    const { namePrefix, bucket, jobQueue, jobDefinition, deadLetterQueue } = props;

    // S3オブジェクト作成イベントの作成
    this.createEvent(namePrefix, bucket, jobQueue, jobDefinition, deadLetterQueue);
  }

  private createEvent(
    namePrefix: string,
    bucket: Bucket,
    jobQueue: JobQueue,
    jobDefinition: EcsJobDefinition,
    deadLetterQueue: Queue,
  ): Rule {
    return new Rule(this, 'S3PutEventRule', {
      ruleName: `${namePrefix}-s3-put-rule`,
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [bucket.bucketName],
          },
          object: {
            key: [{ wildcard: 'originals/*' }],
          },
        },
      },
      targets: [
        new BatchJob(
          jobQueue.jobQueueArn,
          jobQueue,
          jobDefinition.jobDefinitionArn,
          jobDefinition,
          {
            jobName: `${namePrefix}-s3-put-job`,
            attempts: 5,
            deadLetterQueue: deadLetterQueue,
            maxEventAge: Duration.hours(2),
            event: RuleTargetInput.fromObject({
              Parameters: {
                bucketName: EventField.fromPath('$.detail.bucket.name'),
                objectKey: EventField.fromPath('$.detail.object.key'),
              },
            }),
          },
        ),
      ],
    });
  }
}
