import {belongsTo, model, property} from '@loopback/repository';
import {BaseModel} from './base.model';
import {Conversation} from './conversation.model';
import {User} from './user.model';

@model({
  settings: {
    strict: false,
  },
})
export class Message extends BaseModel {
  @belongsTo(() => Conversation)
  conversationId: string;

  @belongsTo(() => User)
  userId: string;

  @property({
    type: 'string',
  })
  content: string;
}

export interface ConversationRelations {}
