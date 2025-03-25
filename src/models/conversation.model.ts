import {belongsTo, model} from '@loopback/repository';
import {BaseModel} from './base.model';
import {User} from './user.model';

@model({
  settings: {
    strict: false,
  },
})
export class Conversation extends BaseModel {
  @belongsTo(() => User)
  userId: string;
}

export interface ConversationRelations {}
