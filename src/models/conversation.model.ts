import {belongsTo, model, property} from '@loopback/repository';
import {BaseModel} from './base.model';
import {User} from './user.model';

@model({
  settings: {
    strict: false,
    indexes: {
      conversationCreatedAt: {
        keys: {createdAt: -1, userId: -1},
      },
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

  //Đây là thuộc tính để đánh dấu thời gian cuối cùng mà người dùng click Nạp code
  //Thuộc tính này dùng để truy vấn history cho model AI
  @property({
    type: 'Date',
  })
  completedDate?: Date;
}

export interface ConversationRelations {}
