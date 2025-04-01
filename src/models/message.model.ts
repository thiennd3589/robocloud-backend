import {belongsTo, model, property} from '@loopback/repository';
import {BaseModel} from './base.model';
import {Conversation} from './conversation.model';
import {ChatRole} from '../types/chat';

@model()
class ContentPart {
  @property({
    type: 'string',
  })
  text: string;
}

@model()
class ChatContent {
  @property({
    type: 'array',
    itemType: ContentPart,
  })
  parts: Array<ContentPart>;
}

@model({
  settings: {
    strict: false,
    indexes: {
      keys: {createdAt: -1},
    },
  },
})
export class Message extends BaseModel {
  @belongsTo(() => Conversation)
  conversationId: string;

  @property({
    type: ChatContent,
  })
  content: ChatContent;

  @property({
    type: 'string',
  })
  role: ChatRole;

  @property({
    type: 'boolean',
  })
  compiled: boolean;
}

export interface MessageRelations {}
