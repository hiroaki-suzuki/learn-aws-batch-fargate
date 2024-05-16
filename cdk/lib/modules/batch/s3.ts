import { Construct } from 'constructs';
import { EnvValues } from '../env/env-values';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';

export class S3Props {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class S3 extends Construct {
  public readonly bucket: Bucket;

  constructor(scope: Construct, id: string, props: S3Props) {
    super(scope, id);

    const { namePrefix } = props;

    // S3バケットの作成
    this.bucket = this.createBucket(namePrefix);
  }

  private createBucket(namePrefix: string): Bucket {
    return new Bucket(this, 'Bucket', {
      bucketName: `${namePrefix}-bucket`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      eventBridgeEnabled: true,
      versioned: true,
    });
  }
}
