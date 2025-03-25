import {service} from '@loopback/core';
import {post, requestBody, get} from '@loopback/rest';
import {LlmService} from '../services/llm.service';

const basePath = '/chat';

export class ChatController {
  constructor(
    @service(LlmService)
    private llmService: LlmService,
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
    const res = await this.llmService.generateContent(body.input);
    return res.data.candidates;
  }
}
