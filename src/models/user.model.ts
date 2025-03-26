import {hasOne, model, property} from '@loopback/repository';
import {BaseModel} from './base.model';
import {UserCredential} from './user-credential.model';
import {USER_TYPES} from '../types/user';
@model({
  settings: {
    strict: false,
    indexes: {
      uniqueEmail: {
        keys: {
          email: 1,
        },
        options: {
          unique: true,
          partialFilterExpression: {email: {$exists: true}},
        },
      },
    },
  },
})
export class User extends BaseModel {
  @property({
    type: 'string',
    required: true,
  })
  fullName: string;

  @property({
    type: 'string',
    required: false,
  })
  firstName?: string;

  @property({
    type: 'string',
    required: false,
  })
  lastName?: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @hasOne(() => UserCredential, {name: 'credentials', keyTo: 'userId'})
  credentials?: UserCredential;

  @property({
    type: 'string',
    default: USER_TYPES.NORMAL_USER,
  })
  type: string;
}

export interface UserRelations {
  credentials?: UserCredential;
}
