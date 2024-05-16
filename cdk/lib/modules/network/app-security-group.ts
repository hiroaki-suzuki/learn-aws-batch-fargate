import { Construct } from 'constructs';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { EnvValues } from '../env/env-values';
import { BaseSecurityGroup } from '../base/base-security-group';

export class AppSecurityGroupProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
  readonly vpc: Vpc;
}

export class AppSecurityGroup extends Construct {
  public readonly batchSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: AppSecurityGroupProps) {
    super(scope, id);

    const { namePrefix, vpc } = props;

    // セキュリティグループの作成
    const batchSecurityGroup = this.createSecurityGroup(namePrefix, vpc);

    this.batchSecurityGroup = batchSecurityGroup;
  }

  private createSecurityGroup(namePrefix: string, vpc: Vpc): SecurityGroup {
    return new BaseSecurityGroup(this, 'BatchSecurityGroup', {
      vpc,
      securityGroupName: `${namePrefix}-batch-sg`,
    });
  }
}
