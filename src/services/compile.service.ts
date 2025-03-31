import {Getter, repository} from '@loopback/repository';
import {MessageRespository} from '../repositories/message.repository';
import {Message} from '../models/message.model';
import fs from 'fs';
import path from 'path';
import {execSync, exec} from 'child_process';
import {error} from 'console';

export class CompileService {
  constructor(
    @repository.getter(MessageRespository)
    private messageRepositoryGetter: Getter<MessageRespository>,
  ) {}

  async extractCode(message: Message) {
    const text = message.content?.parts[0]?.text;

    /**
     * Trích xuất các khối mã từ văn bản.
     */
    console.log('======Extract Code====');
    const regex = /`(?:arduino|cpp|python)?\n([\s\S]*?)\n`/g;
    let codeBlocks = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      codeBlocks.push(match[1]);
    }

    const code = codeBlocks.join('');

    const filePath = path.join(__dirname, '../../sketches');
    const dir = `${filePath}/${message.id}-sketch`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(`${filePath}/${message.id}-sketch`);
    }

    fs.writeFileSync(`${dir}/${message.id}-sketch.ino`, code);
    console.log('======Compile Code====');

    await new Promise((resolve, reject) => {
      exec(
        `cd ${dir} && arduino-cli compile --fqbn arduino:avr:uno --build-path ./build`,
        error => {
          if (error) {
            console.log('====COMPILE ERROR=====');
            console.log(error);
            reject();
          }

          resolve(true);
        },
      );
    });

    // execSync(
    //   `cd ${dir} && arduino-cli compile --fqbn arduino:avr:uno --build-path ./build`,
    // );

    console.log('======Compiled====');
  }
}
