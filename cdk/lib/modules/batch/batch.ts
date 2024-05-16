import { Construct } from 'constructs';
import { EnvValues } from '../env/env-values';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import {
  EcsFargateContainerDefinition,
  EcsJobDefinition,
  FargateComputeEnvironment,
  JobQueue,
} from 'aws-cdk-lib/aws-batch';
import { Duration } from 'aws-cdk-lib';
import { Size } from 'aws-cdk-lib/core';
import { ContainerImage, LogDriver } from 'aws-cdk-lib/aws-ecs';
import { BaseLogGroup } from '../base/base-log-group';
import { Repository } from 'aws-cdk-lib/aws-ecr';

export class BatchProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
  readonly vpc: Vpc;
  readonly batchSecurityGroup: SecurityGroup;
  readonly ecsExecRole: Role;
  readonly ecsTaskRole: Role;
  readonly repository: Repository;
}

export class Batch extends Construct {
  public readonly jobQueue: JobQueue;
  public readonly jobDefinition: EcsJobDefinition;

  constructor(scope: Construct, id: string, props: BatchProps) {
    super(scope, id);

    const { namePrefix, vpc, batchSecurityGroup, ecsExecRole, ecsTaskRole, repository } = props;

    // コンピューティング環境の作成
    const computeEnvironment = this.createComputeEnvironment(namePrefix, vpc, batchSecurityGroup);

    // ジョブキューの作成
    const jobQueue = this.createJobQueue(namePrefix, computeEnvironment);

    // ジョブ定義の作成
    const jobDefinition = this.createJobDefinition(
      namePrefix,
      ecsExecRole,
      ecsTaskRole,
      repository,
    );

    this.jobQueue = jobQueue;
    this.jobDefinition = jobDefinition;
  }

  private createComputeEnvironment(
    namePrefix: string,
    vpc: Vpc,
    batchSecurityGroup: SecurityGroup,
  ): FargateComputeEnvironment {
    return new FargateComputeEnvironment(this, 'ComputeEnvironment', {
      computeEnvironmentName: `${namePrefix}-compute-environment`,
      maxvCpus: 256,
      vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PUBLIC,
      }),
      securityGroups: [batchSecurityGroup],
    });
  }

  private createJobQueue(
    namePrefix: string,
    computeEnvironment: FargateComputeEnvironment,
  ): JobQueue {
    return new JobQueue(this, 'JobQueue', {
      jobQueueName: `${namePrefix}-job-queue`,
      computeEnvironments: [
        {
          computeEnvironment,
          order: 1,
        },
      ],
    });
  }

  private createJobDefinition(
    namePrefix: string,
    ecsExecRole: Role,
    ecsTaskRole: Role,
    repository: Repository,
  ): EcsJobDefinition {
    return new EcsJobDefinition(this, 'JobDefinition', {
      jobDefinitionName: `${namePrefix}-job-definition`,
      timeout: Duration.minutes(60),
      retryAttempts: 3,
      container: new EcsFargateContainerDefinition(this, 'Container', {
        image: ContainerImage.fromEcrRepository(repository, 'latest'),
        command: [
          'node',
          '/usr/src/app/app.js',
          '--bucketName',
          'Ref::bucketName',
          '--objectKey',
          'Ref::objectKey',
        ],
        executionRole: ecsExecRole,
        jobRole: ecsTaskRole,
        cpu: 1,
        memory: Size.gibibytes(2),
        assignPublicIp: true,
        logging: LogDriver.awsLogs({
          streamPrefix: 'batch',
          logGroup: new BaseLogGroup(this, 'LogGroup', {
            logGroupName: `${namePrefix}-batch-log`,
          }),
        }),
      }),
    });
  }
}
