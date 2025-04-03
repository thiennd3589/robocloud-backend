import {Getter, repository} from '@loopback/repository';
import {ConversationRepository} from '../repositories/conversation.repository';
import {MessageRespository} from '../repositories/message.repository';
import {BindingScope, injectable, service} from '@loopback/core';
import {LlmService} from './llm.service';
import {HttpErrors} from '@loopback/rest';
import {ChatRole, ChatType} from '../types/chat';
import {CompileService} from './compile.service';
import {Message} from '../models/message.model';
import {Content} from '@google/genai';

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
    // @inject('services.LlmService') private llmService: LlmService,

    @service(CompileService) private compileService: CompileService,
  ) {}

  async createResponseForQuestion(
    input: string,
    conversationId: string,
    userId: string,
    isGenerateCode?: boolean,
  ) {
    let message: Message | null = null;
    const [conversationRepo, messageRepo] = await Promise.all([
      this.conversationRepositoryGetter(),
      this.messageRepositoryGetter(),
    ]);

    try {
      console.log('====GENERATE RESPONSE=====');

      let isNewConversation = conversationId === this.newConversationId;
      let finalConversationId = conversationId;
      let history: Content[] = [];

      if (isNewConversation) {
        // Kiểm tra Message có thuộc Conversation nào chưa
        // Nếu chưa thì tạo Conversation mới
        const newConversation = await conversationRepo.create({
          userId,
        });
        finalConversationId = newConversation.id;
        isNewConversation = true;
      } else {
        // Nếu Message đã thuộc Conversation
        // Tìm kiếm lịch sử Message
        const messageHistory = await this.findChatHistory(finalConversationId);

        history = this.convertMessageArrayToContentArray(messageHistory);
      }

      const [_, modelResponse] = await Promise.all([
        isGenerateCode
          ? new Promise(resolve => resolve(''))
          : messageRepo.create({
              createdAt: new Date(),
              conversationId: finalConversationId,
              role: ChatRole.USER,
              content: {
                parts: [{text: input}],
              },
            }),
        isGenerateCode
          ? this.llmService.generateCode(history)
          : this.llmService.generateFromQuestion(history, input),
      ]);

      const content = modelResponse.candidates?.[0].content || {
        parts: [{text: ''}],
      };

      const canCompiled = this.checkCanCompiled(content.parts?.[0].text || '');

      message = await messageRepo.create({
        conversationId: finalConversationId,
        content,
        role: ChatRole.MODEL,
        createdAt: new Date(),
        canCompiled,
        type: isGenerateCode ? ChatType.CODE : ChatType.QUESTION,
      });

      if (isGenerateCode) {
        await Promise.all([
          conversationRepo.updateById(finalConversationId, {
            completedDate: new Date(),
          }),
        ]);

        return {
          ...message,
          compiled: true,
          type: ChatType.CODE,
        };
      }

      return message;
    } catch (error) {
      console.log(error);
      if (message) return message;
      throw HttpErrors.BadRequest('somethingWrongWhenResponse');
    }
  }

  async findChatHistory(conversationId: string) {
    const [conversationRepo, messageRepo] = await Promise.all([
      this.conversationRepositoryGetter(),
      this.messageRepositoryGetter(),
    ]);

    const conversation = await conversationRepo.findById(conversationId, {
      fields: {completedDate: true},
    });

    if (!conversation) throw HttpErrors.BadRequest('conversationNotFound');

    const completedDate = conversation.completedDate;

    return messageRepo.find({
      where: {
        conversationId: conversationId,
        ...(completedDate
          ? {
              createdAt: {
                gt: completedDate,
              },
            }
          : {}),
      },
      fields: {
        content: true,
        role: true,
      },
    });
  }

  convertMessageArrayToContentArray(messages: Message[]) {
    return messages.map(message => ({
      parts: message.content.parts,
      role: message.role,
    }));
  }

  /**
   * Kiểm tra xem có từ "Tạo code" ở câu cuối không
   * @param markdown - response of llm
   */
  checkCanCompiled(markdown: string, keyword = 'Tạo code') {
    // Tách markdown thành các câu bằng dấu chấm, chấm hỏi, hoặc chấm than
    let sentences = markdown.split(/(?<=[.!?])\s+/);

    console.log('markdown', markdown);

    // Lấy câu cuối cùng (nếu có) và chuẩn hóa chữ thường
    let lastSentence = (
      sentences[sentences.length - 1] + sentences[sentences.length - 2]
    ).toLowerCase();

    console.log(lastSentence);

    // Kiểm tra xem câu cuối có chứa từ khóa không (cũng chuyển về chữ thường)
    return lastSentence.includes(keyword.toLowerCase());
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
