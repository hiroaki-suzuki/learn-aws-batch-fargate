import { Construct } from 'constructs';
import { EnvValues } from '../env/env-values';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export interface IAMProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class IAM extends Construct {
  public readonly ecsExecRole: Role;
  public readonly ecsTaskRole: Role;

  constructor(scope: Construct, id: string, props: IAMProps) {
    super(scope, id);

    const { namePrefix } = props;

    // ECS実行用のIAMロール
    const ecsExecRole = this.createEcsExecRole(namePrefix);

    // ECSタスク用のIAMロール
    const ecsTaskRole = this.createEcsTaskRole(namePrefix);

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

  private createEcsTaskRole(namePrefix: string): Role {
    return new Role(this, 'EcsTaskRole', {
      roleName: `${namePrefix}-ecs-task-role`,
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
  }
}
