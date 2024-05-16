import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as path from 'node:path';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { DockerImageName, ECRDeployment } from 'cdk-ecr-deployment';
import { EnvValues } from '../env/env-values';

export class EcrProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class Ecr extends Construct {
  public readonly repository: Repository;

  constructor(scope: Construct, id: string, props: EcrProps) {
    super(scope, id);

    const { namePrefix } = props;

    // リポジトリの作成
    const repository = this.createRepository(namePrefix);

    // イメージのデプロイ
    this.deployImage(namePrefix, repository);

    this.repository = repository;
  }

  private createRepository(namePrefix: string): Repository {
    return new Repository(this, 'Repository', {
      repositoryName: `${namePrefix}-repository`,
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      imageScanOnPush: true,
    });
  }

  private deployImage(namePrefix: string, repository: Repository): void {
    const image = new DockerImageAsset(this, 'BatchImage', {
      assetName: `${namePrefix}-batch-image`,
      directory: path.join(__dirname, '..', '..', '..', '..', 'batch'),
      platform: Platform.LINUX_AMD64,
    });

    new ECRDeployment(this, `${namePrefix}-batch-ecr-deploy`, {
      src: new DockerImageName(image.imageUri),
      dest: new DockerImageName(`${repository.repositoryUri}:latest`),
    });
  }
}
