import {
  BelongsToAccessor,
  DefaultCrudRepository,
  juggler,
  repository,
} from '@loopback/repository';
import {Getter, inject} from '@loopback/core';
import {
  UserCredential,
  UserCredentialRelations,
} from '../models/user-credential.model';
import {User} from '../models/user.model';
import {UserRepository} from './user.repository';
import {
  Conversation,
  ConversationRelations,
} from '../models/conversation.model';

export class ConversationRepository extends DefaultCrudRepository<
  Conversation,
  typeof Conversation.prototype.id,
  ConversationRelations
> {
  public readonly user: BelongsToAccessor<
    User,
    typeof Conversation.prototype.id
  >;
  constructor(
    @inject('datasources.mongodb') dataSource: juggler.DataSource,
    @repository.getter(UserRepository)
    userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Conversation, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
