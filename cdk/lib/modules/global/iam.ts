import { Construct } from 'constructs';
import { EnvValues } from '../env/env-values';
import {
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export interface IAMProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
  readonly bucket: Bucket;
}

export class IAM extends Construct {
  public readonly ecsExecRole: Role;
  public readonly ecsTaskRole: Role;

  constructor(scope: Construct, id: string, props: IAMProps) {
    super(scope, id);

    const { namePrefix, bucket } = props;

    // ECS実行用のIAMロール
    const ecsExecRole = this.createEcsExecRole(namePrefix);

    // ECSタスク用のIAMロール
    const ecsTaskRole = this.createEcsTaskRole(namePrefix, bucket);

    this.ecsExecRole = ecsExecRole;
    this.ecsTaskRole = ecsTaskRole;
  }

  private createEcsExecRole(namePrefix: string): Role {
    return new Role(this, 'EcsExecRole', {
      roleName: `${namePrefix}-ecs-exec-role`,
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });
  }

  private createEcsTaskRole(namePrefix: string, bucket: Bucket): Role {
    return new Role(this, 'EcsTaskRole', {
      roleName: `${namePrefix}-ecs-task-role`,
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      inlinePolicies: {
        's3-access': new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${bucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });
  }
}
