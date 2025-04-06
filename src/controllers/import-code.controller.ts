import {authenticate} from '@loopback/authentication';
import {Getter, repository} from '@loopback/repository';
import {get, HttpErrors, param} from '@loopback/rest';
import {MessageRespository} from '../repositories/message.repository';
import fs from 'fs';
import path from 'path';
import {service} from '@loopback/core';
import {CompileService} from '../services/compile.service';
import {ConversationRepository} from '../repositories/conversation.repository';
import {ChatRole, ChatType} from '../types/chat';

const basePath = '/import-code';

export class ImportCodeController {
  constructor(
    @repository.getter(MessageRespository)
    private messageRepoGetter: Getter<MessageRespository>,
    @repository.getter(ConversationRepository)
    private conversationRepoGetter: Getter<ConversationRepository>,
    @service(CompileService) private compileService: CompileService,
  ) {}

  @get(`${basePath}/{conversationId}`)
  @authenticate('jwt')
  async importCode(
    @param.path.string('conversationId') conversationId: string,
  ) {
    const [conversationRepo, messageRepo] = await Promise.all([
      this.conversationRepoGetter(),
      this.messageRepoGetter(),
    ]);

    const conversation = conversationRepo.findById(conversationId);

    if (!conversation) throw HttpErrors.BadRequest('conversationNotFound');

    const message = await messageRepo.findOne({
      where: {
        conversationId,
      },
      order: ['createdAt DESC'],
    });

    if (
      !message ||
      message.type !== ChatType.CODE ||
      message.role !== ChatRole.MODEL
    )
      throw HttpErrors.BadRequest('messageNotFound');

    const messageId = message.id;

    try {
      await this.compileService.extractCode(message);
    } catch (error) {
      const message = error.message.replace(/(?:\/[\w.-]+)+/g, '');
      throw HttpErrors.BadRequest(message);
    }

    const sketchesPath = '../../sketches';

    const filePath = path.join(
      __dirname,
      `${sketchesPath}/${messageId}-sketch/build/${messageId}-sketch.ino.with_bootloader.hex`,
    );

    if (!fs.existsSync(filePath)) throw HttpErrors.BadRequest('buildNotFound');

    const hexData = fs.readFileSync(filePath, 'utf8');

    fs.rmSync(path.join(__dirname, `${sketchesPath}/${messageId}-sketch`), {
      recursive: true,
      force: true,
    });

    return {
      hex: hexData,
    };
  }
}
