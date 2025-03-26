import {Getter, inject} from '@loopback/core';
import {post} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {ConversationRepository} from '../repositories/conversation.repository';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, UserProfile} from '@loopback/security';

const basePath = '/conversation';

export class ConversationController {
  constructor(
    @repository.getter(ConversationRepository)
    private conversationRepositoryGetter: Getter<ConversationRepository>,
  ) {}

  @post(`${basePath}/create`)
  @authenticate('jwt')
  async createConversaction(
    @inject(SecurityBindings.USER) currentUserProfile?: UserProfile,
  ) {
    return {currentUserProfile};
  }
}
