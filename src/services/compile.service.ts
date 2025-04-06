import {Message} from '../models/message.model';
import fs from 'fs';
import path from 'path';
import {exec} from 'child_process';
import {BindingScope, injectable} from '@loopback/core';

@injectable({scope: BindingScope.SINGLETON})
export class CompileService {
  constructor() {}

  async extractCode(message: Message) {
    const text = message.content?.parts[0]?.text;

    /**
     * Trích xuất các khối mã từ văn bản.
     */
    console.log('======Extract Code====');
    const regex = /```(?:arduino|cpp|python|c\+\+|c)?\n?([\s\S]+?)```/g;

    // const regex = /`(?:arduino|cpp|python)?\n([\s\S]*?)\n`/g;
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
            // console.log(,error.message);
            reject(error);
          }

          resolve(true);
        },
      );
    });

    console.log('======Compiled====');
  }
}
