import { BelongsToAccessor, DefaultCrudRepository, juggler, repository } from "@loopback/repository";
import { Getter, inject } from "@loopback/core";
import { UserCredential, UserCredentialRelations } from "../models/user-credential.model";
import { User } from "../models/user.model";
import { UserRepository } from "./user.repository";

export class UserCredentialRepository extends DefaultCrudRepository<UserCredential, typeof UserCredential.prototype.id, UserCredentialRelations> {
  public readonly user: BelongsToAccessor<User, typeof UserCredential.prototype.id> 
  constructor(
    @inject("datasources.mongodb") dataSource: juggler.DataSource,
    @repository.getter(UserRepository) userRepositoryGetter: Getter<UserRepository>
  ) {
    super(UserCredential, dataSource);
    this.user = this.createBelongsToAccessorFor("user", userRepositoryGetter);
    this.registerInclusionResolver("user", this.user.inclusionResolver);
  }
}