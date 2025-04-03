import {inject, service} from '@loopback/core';
import {
  Request,
  RestBindings,
  get,
  response,
  ResponseObject,
  post,
  param,
  HttpErrors,
  requestBody,
} from '@loopback/rest';
import {CompileService} from '../services/compile.service';
import {repository} from '@loopback/repository';
import {MessageRespository} from '../repositories/message.repository';
import {LlmService} from '../services/llm.service';
import {Content} from '@google/genai';

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
};

/**
 * A simple controller to bounce back http requests
 */
export class PingController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @service(CompileService) private compileService: CompileService,
    @repository(MessageRespository) private messageRepo: MessageRespository,
    @service(LlmService) private LlmService: LlmService,
  ) {}

  // Map to `GET /ping`
  @post('/ping')
  @response(200, PING_RESPONSE)
  // @authenticate('jwt')
  ping(
    @requestBody()
    body: {
      data: Content[];
      input: string;
    },
  ): object {
    // Reply with a greeting, the current time, the url, and request headers
    return this.LlmService.generateFromQuestion(body.data, body.input);
  }

  @get('/extract-code/{messageId}')
  async extractCode(@param.path.string('messageId') messageId: string) {
    const message = await this.messageRepo.findById(messageId);

    if (!message) throw HttpErrors.BadRequest('notFOundMessage');

    return this.compileService.extractCode(message);
  }
}
