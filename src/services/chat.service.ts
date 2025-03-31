import {Getter, repository} from '@loopback/repository';
import {ConversationRepository} from '../repositories/conversation.repository';
import {MessageRespository} from '../repositories/message.repository';
import {BindingScope, injectable, service} from '@loopback/core';
import {LlmService} from './llm.service';
import {HttpErrors} from '@loopback/rest';
import {ChatRole} from '../types/chat';
import {CompileService} from './compile.service';

@injectable({scope: BindingScope.SINGLETON})
export class ChatService {
  private newConversationId = 'new';
  constructor(
    @repository.getter(ConversationRepository)
    private conversationRepositoryGetter: Getter<ConversationRepository>,
    @repository.getter(MessageRespository)
    private messageRepositoryGetter: Getter<MessageRespository>,
    @service(LlmService)
    private llmService: LlmService,
    @service(CompileService) private compileService: CompileService,
  ) {}

  async createChat(input: string, conversationId: string, userId: string) {
    console.log('====GENERATE RESPONSE=====');
    let finalConversationId = conversationId;
    const [conversationRepo, messageRepo] = await Promise.all([
      this.conversationRepositoryGetter(),
      this.messageRepositoryGetter(),
    ]);
    if (conversationId === this.newConversationId) {
      const newConversation = await conversationRepo.create({
        userId,
      });
      finalConversationId = newConversation.id;
    }

    const [_, modelResponse] = await Promise.all([
      messageRepo.create({
        createdAt: new Date(),
        conversationId: finalConversationId,
        role: ChatRole.USER,
        content: {
          parts: [{text: input}],
        },
      }),
      this.llmService.generateContent(input),
    ]);

    const message = await messageRepo.create({
      conversationId: finalConversationId,
      content: {...modelResponse.data.candidates[0].content},
      role: ChatRole.MODEL,
      createdAt: new Date(),
    });

    await this.compileService.extractCode(message);
    return message;
  }

  async createChatWithoutSave(input: string) {
    const modelResponse = await this.llmService.generateContent(input);
    return modelResponse.data.candidates;
  }

  async findChatByConversationId(conversationId: string, userId: string) {
    const messageRepo = await this.messageRepositoryGetter();
    const conversationRepo = await this.conversationRepositoryGetter();

    const conversation = conversationRepo.find({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) throw HttpErrors.BadRequest('conversationNotExits');

    const data = await messageRepo.find({
      order: ['createdAt DESC'],
      limit: 15,
      where: {
        conversationId,
      },
    });
    return data.reverse();
  }
}
