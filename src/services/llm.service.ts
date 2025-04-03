import {BindingScope, injectable} from '@loopback/core';
import axios from 'axios';
import {GoogleGenAI, Content} from '@google/genai';

@injectable({scope: BindingScope.SINGLETON})
export class LlmService {
  private llmKey: string;
  private baseApi: string;
  private ai: GoogleGenAI;
  private modelName = 'gemini-2.0-flash-lite';
  private genCodePrompt = `
          Dựa vào những thông tin ở trên, hãy tạo đoạn mã cho robot arduino code C phù hợp. Phản hồi chỉ sinh mã code arduino C và KHÔNG kèm giải thích.
          Mô tả robot arduino được liệt kê như dưới đây:
          - Robot sử dụng arduino uno R3

          - Màn hình OLED 0.96 inch, NẾU SỬ DỤNG sẽ  được khai báo trong code như sau:
          #define WIDTH 128
          #define HEIGTH 64
          #define OLED_RESET 4
          #define SCREEN_ADDRESS 0x3C
          #include <Arduino.h>
          #include <Adafruit_SSD1306.h>
          #include <Adafruit_GFX.h>
          #include <Wire.h>
          Adafruit_SSD1306 display(WIDTH, HEIGTH, &Wire, OLED_RESET);

          - module L298N để điều khiển động cơ trái và động cơ phải,  NẾU SỬ DỤNG sẽ được khai báo như sau:
          // Thiết lập động cơ trái
          #define INM11        5
          #define INM12        12

          // Thiết lập động cơ phải
          #define INM21        6
          #define INM22        13

          - Kết nối chân: Đèn LED với chân digital 11, NẾU SỬ DỤNG sẽ được khai báo như sau:
          // Thiết lập đèn LED
          byte ledPin11 = 11; 

          -  Nút nhấn trái với chân 7, được xác định nhấn khi đọc tín hiệu digital HIGH, NẾU SỬ DỤNG sẽ được khai báo như sau:
          #define BUTTON_LEFT 7

          -  Nút nhấn Phải với chân 8, được xác định nhấn khi đọc tín hiệu digital HIGH, NẾU SỬ DỤNG sẽ được khai báo như sau:
          #define BUTTON_RIGHT 8

          - cảm biến ánh sáng với chân A0, NẾU SỬ DỤNG sẽ được khai báo như sau:

          // thiết lập cảm biến ánh sáng
          int cambienanhsangA0 = A0;

          - Cảm biến hồng ngoại với chân 10, NẾU SỬ DỤNG sẽ được khai báo như sau:

          // Thư viện cho cảm biến hồng ngoại điều khiển IR
          #include <IRremote.h>


          // Thiết lập cảm biến hồng ngoại IR và điều khiển
          #define IR_REMOTE_UP 0xFF18E7  // Nút lên trên điều khiển
          #define IR_REMOTE_DOWN 0xFF4AB5 // Nút xuống trên điều khiển
          #define IR_REMOTE_RIGHT 0xFF5AA5 // Nút phải trên điều khiển
          #define IR_REMOTE_LEFT 0xFF10EF // Nút trái trên điều khiển
          #define IR_REMOTE_OK 0xFF38C7 // Nút ok trên điều khiển 

          #define IR_REMOTE_0 0xFF9867 // Nút số 0 trên điều khiển
          #define IR_REMOTE_1 0xFFA25D  // Nút số 1 trên điều khiển
          #define IR_REMOTE_2 0xFF629D  // Nút số 2 trên điều khiển
          #define IR_REMOTE_3 0xFFE21D  // Nút số 3 trên điều khiển
          #define IR_REMOTE_4 0xFF22DD // Nút số 4 trên điều khiển
          #define IR_REMOTE_5 0xFF02FD  // Nút số 5 trên điều khiển
          #define IR_REMOTE_6 0xFFC23D // Nút số 6 trên điều khiển
          #define IR_REMOTE_7 0xFFE01F // Nút số 7 trên điều khiển
          #define IR_REMOTE_8 0xFFA857 // Nút số 8  trên điều khiển
          #define IR_REMOTE_9 0xFF906F // Nút số 9 trên điều khiển

          IRrecv irrecv(10);
          decode_results results;


          // Các thư viện hữu ích khác (nếu cần)
          #include <Servo.h>
          #include <NewPing.h>
          #include <SoftwareSerial.h>
          #include <SPI.h>
          #include <EEPROM.h>
        `;

  private systemInstructions = `
    Bạn là một chuyên gia về lập trình C/C++ trên Kit Arduino và có khả năng sư phạm cho học sinh. Bạn đang lập trình robot arduino có động cơ di chuyển và màn hình OLED.
    Hãy thực hiện yêu những yêu cầu của người dùng và giải thích đơn giản ngắn gọn về nguyên lý chung của ý tưởng. Lưu ý ko kèm theo code hay bất cứ cú pháp nào liên quan tới ngôn ngữ lập trình.
    Phân tích yêu cầu của người dùng để xử lý phản hồi thêm với các trường hợp dưới đây:
    Nếu là một yêu cầu cụ thể thì hỏi lại xem có cần yêu cầu gì bổ sung thêm ko. Nếu ko có yêu cầu gì và muốn tạo mã code thì hãy phản hồi về việc nhấn vào nút "Tạo Code" bên dưới đây.
    Nếu là một câu hỏi chung chung thì phản hồi có cần yêu cầu gì bổ sung thêm ko.
  `;

  constructor() {
    this.llmKey = process.env.LLM_API_KEY ?? '';
    this.baseApi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.llmKey}`;
    this.ai = new GoogleGenAI({apiKey: process.env.LLM_API_KEY});
  }

  async generateContent(input: string) {
    // const finalInput = `Trả lời bằng Tiếng Việt. ${this.defaultPrompt} Tạo một sketch Arduino hoàn chỉnh cho board Arduino uno với màn hình OLED SSD1306 (128x64) để ${input}. Sketch phải bao gồm tất cả thư viện cần thiết, hàm setup và loop được cấu hình đúng."`;

    // const prompt = this.getPrompt(input);
    return axios.post(this.baseApi, {
      contents: [
        {
          parts: [{text: input}],
        },
      ],
    });
  }

  async generateFromQuestion(history: Content[], input: string) {
    const chat = this.ai.chats.create({
      model: this.modelName,
      history,
      config: {
        systemInstruction: this.systemInstructions,
      },
    });

    return chat.sendMessage({
      message: input,
    });
  }

  async generateCode(history: Content[]) {
    const chat = this.ai.chats.create({
      model: this.modelName,
      history,
    });

    return chat.sendMessage({
      message: this.genCodePrompt,
    });
  }
}
