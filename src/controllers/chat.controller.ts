import {inject, service} from '@loopback/core';
import {post, requestBody, get, param} from '@loopback/rest';
import {ChatService} from '../services/chat.service';
import {SecurityBindings} from '@loopback/security';
import {authenticate} from '@loopback/authentication';

const basePath = '/chat';

export class ChatController {
  constructor(
    @service(ChatService)
    private chatService: ChatService,
  ) {}

  @get(`${basePath}/public`)
  getPublicChat() {
    return {
      data: [],
    };
  }

  @post(`${basePath}/public`)
  async publicChat(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
              },
            },
            required: ['input'],
          },
        },
      },
    })
    body: {
      input: string;
    },
  ) {
    return this.chatService.createChatWithoutSave(body.input);
  }

  @post(`${basePath}`)
  @authenticate('jwt')
  async privateChat(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
              },
              conversationId: {
                type: 'string',
              },
              isGenerateCode: {
                type: 'boolean',
              },
            },
            required: ['input', 'conversationId'],
          },
        },
      },
    })
    body: {
      input: string;
      conversationId: string;
      isGenerateCode: boolean;
    },
    @inject(SecurityBindings.USER) currentUser: any,
  ) {
    const {input, conversationId, isGenerateCode} = body;
    return this.chatService.createResponseForQuestion(
      input,
      conversationId,
      currentUser.id,
      !!isGenerateCode,
    );
  }

  @get(`${basePath}/{conversationId}`)
  @authenticate('jwt')
  async getChatByConversationId(
    @inject(SecurityBindings.USER) currentUserProfile: any,
    @param.path.string('conversationId') conversationId: string,
  ) {
    return this.chatService.findChatByConversationId(
      conversationId,
      currentUserProfile.id,
    );
  }
}
