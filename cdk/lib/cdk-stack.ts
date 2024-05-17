import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvValues } from './modules/env/env-values';
import { Network } from './modules/network/network';
import { IAM } from './modules/global/iam';
import { AppSecurityGroup } from './modules/network/app-security-group';
import { Batch } from './modules/batch/batch';
import { Ecr } from './modules/batch/ecr';
import { S3 } from './modules/batch/s3';
import { SQS } from './modules/batch/sqs';
import { EventRule } from './modules/batch/event-rule';

export interface CdkStackProps extends cdk.StackProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const { namePrefix, envValues } = props;

    const network = new Network(this, 'Network', {
      namePrefix,
      envValues,
    });

    const securityGroup = new AppSecurityGroup(this, 'SecurityGroup', {
      namePrefix,
      envValues,
      vpc: network.vpc,
    });

    const s3 = new S3(this, 'S3', {
      namePrefix,
      envValues,
    });
    const iam = new IAM(this, 'IAM', {
      namePrefix,
      envValues,
      bucket: s3.bucket,
    });

    const ecr = new Ecr(this, 'Ecr', {
      namePrefix,
      envValues,
    });

    const batch = new Batch(this, 'Batch', {
      namePrefix,
      envValues,
      vpc: network.vpc,
      batchSecurityGroup: securityGroup.batchSecurityGroup,
      ecsExecRole: iam.ecsExecRole,
      ecsTaskRole: iam.ecsTaskRole,
      repository: ecr.repository,
    });

    const sqs = new SQS(this, 'SQS', {
      namePrefix,
      envValues,
    });

    new EventRule(this, 'EventRule', {
      namePrefix,
      envValues,
      bucket: s3.bucket,
      jobQueue: batch.jobQueue,
      jobDefinition: batch.jobDefinition,
      deadLetterQueue: sqs.deadLetterQueue,
    });
  }
}
