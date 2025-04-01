import {Getter, inject} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';
import {ConversationRepository} from '../repositories/conversation.repository';
import {get, param, post, requestBody} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {Conversation} from '../models/conversation.model';
import {SecurityBindings} from '@loopback/security';
import {User} from '../models/user.model';

const basePath = '/conversation';

export class ConversationController {
  constructor(
    @repository.getter(ConversationRepository)
    private conversationRepositoryGetter: Getter<ConversationRepository>,
  ) {}

  @get(`${basePath}`)
  @authenticate('jwt')
  async getConversaction(
    @param.query.object('filter') filter: Filter<Conversation>,
    @inject(SecurityBindings.USER) currentUserProfile: User,
  ) {
    const baseFilter = {...filter};
    const conversationRepository = await this.conversationRepositoryGetter();
    return conversationRepository.find({
      ...baseFilter,
      order: ['_id DESC'],
      limit: 15,
      where: {
        ...baseFilter.where,
        userId: currentUserProfile.id,
      },
    });
  }

  @post(`${basePath}`)
  @authenticate('jwt')
  async createConversaction(
    @inject(SecurityBindings.USER) currentUser: User,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
              },
            },
            required: ['title'],
          },
        },
      },
    })
    body: {title: string},
  ) {
    const conversationRepo = await this.conversationRepositoryGetter();
    return conversationRepo.create({
      userId: currentUser.id,
      title: body.title,
      createdAt: new Date(),
    });
  }
}
