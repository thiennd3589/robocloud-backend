import {belongsTo, model, property} from '@loopback/repository';
import {BaseModel} from './base.model';
import {User} from './user.model';

@model({
  settings: {
    strict: false,
    indexes: {
      keys: {createdAt: -1},
    },
  },
})
export class Conversation extends BaseModel {
  @belongsTo(() => User)
  userId: string;

  @property({
    type: 'string',
  })
  title: string;
}

export interface ConversationRelations {}
