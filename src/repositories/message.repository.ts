import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {Message, MessageRelations} from '../models/message.model';

export class MessageRespository extends DefaultCrudRepository<
  Message,
  typeof Message.prototype.id,
  MessageRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: juggler.DataSource) {
    super(Message, dataSource);
  }
}
