import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { EnvValues } from '../env/env-values';

export class SQSProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class SQS extends Construct {
  public readonly deadLetterQueue: Queue;

  constructor(scope: Construct, id: string, props: SQSProps) {
    super(scope, id);

    const { namePrefix } = props;

    // デッドレターキューの作成
    this.deadLetterQueue = this.createDeadLetterQueue(namePrefix);
  }

  private createDeadLetterQueue(namePrefix: string): Queue {
    return new Queue(this, 'DeadLetterQueue', {
      queueName: `${namePrefix}-dead-letter-queue`,
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
