import {authenticate} from '@loopback/authentication';
import {Getter, repository} from '@loopback/repository';
import {get, HttpErrors, param} from '@loopback/rest';
import {MessageRespository} from '../repositories/message.repository';
import fs from 'fs';
import path from 'path';

const basePath = '/import-code';

export class ImportCodeController {
  constructor(
    @repository.getter(MessageRespository)
    private messageRepoGetter: Getter<MessageRespository>,
  ) {}

  @get(`${basePath}/{messageId}`)
  @authenticate('jwt')
  async importCode(@param.path.string('messageId') messageId: string) {
    const messageRepo = await this.messageRepoGetter();

    const message = await messageRepo.findById(messageId);

    if (!message) throw HttpErrors.BadRequest('messageNotFound');

    const filePath = path.join(
      __dirname,
      `../../sketches/${messageId}-sketch/build/${messageId}-sketch.ino.with_bootloader.hex`,
    );

    if (!fs.existsSync(filePath)) throw HttpErrors.BadRequest('buildNotFound');

    const hexData = fs.readFileSync(filePath, 'utf8');

    return {
      hex: hexData,
    };
  }
}
