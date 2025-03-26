import {
  DefaultCrudRepository,
  HasOneRepositoryFactory,
  juggler,
  repository,
} from '@loopback/repository';
import {User, UserRelations} from '../models/user.model';
import {Getter, inject} from '@loopback/core';
import {UserCredential} from '../models/user-credential.model';
import {UserCredentialRepository} from './user-credential.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  public readonly credentials: HasOneRepositoryFactory<
    UserCredential,
    typeof User.prototype.id
  >;
  constructor(
    @inject('datasources.mongodb') dataSource: juggler.DataSource,
    @repository.getter('UserCredentialRepository')
    userCredentialRepositoryGetter: Getter<UserCredentialRepository>,
  ) {
    super(User, dataSource);
    this.credentials = this.createHasOneRepositoryFactoryFor(
      'credentials',
      userCredentialRepositoryGetter,
    );
    this.registerInclusionResolver(
      'credentials',
      this.credentials.inclusionResolver,
    );
  }

  async findCredentials(
    userId: typeof User.prototype.id,
  ): Promise<UserCredential | undefined> {
    try {
      return await this.credentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }
}
