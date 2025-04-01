import {BindingScope, injectable} from '@loopback/core';
import axios from 'axios';

@injectable({scope: BindingScope.SINGLETON})
export class LlmService {
  private llmKey: string;
  private baseApi: string;
  // private defaultPrompt = `Tôi dùng màn hình oled và arduino, với thiết lập:
  // #include "Adafruit_SSD1306.h"
  // #include "Adafruit_GFX.h"
  // #include "SPI.h"

  // #include <Arduino.h>
  // #include <Wire.h>
  // #include <SoftwareSerial.h>

  // #define WIDTH 128
  // #define HEIGTH 64
  // #define OLED_RESET 4
  // #define SCREEN_ADDRESS 0x3C

  // Adafruit_SSD1306 display(WIDTH, HEIGTH, &Wire, OLED_RESET);
  // `;

  constructor() {
    this.llmKey = process.env.LLM_API_KEY ?? '';
    this.baseApi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.llmKey}`;
  }

  async generateContent(input: string) {
    // const finalInput = `Trả lời bằng Tiếng Việt. ${this.defaultPrompt} Tạo một sketch Arduino hoàn chỉnh cho board Arduino uno với màn hình OLED SSD1306 (128x64) để ${input}. Sketch phải bao gồm tất cả thư viện cần thiết, hàm setup và loop được cấu hình đúng."`;

    const prompt = this.getPrompt(input);
    return axios.post(this.baseApi, {
      contents: [
        {
          parts: [{text: prompt}],
        },
      ],
    });
  }

  getPrompt(input: string) {
    return `
      Tôi có một bộ thiết bị phần cứng với vi điều khiển arduino uno, cùng với các linh kiện phần cứng được kết nối mặc định:
      Đèn LED với chân 11, Cảm biến hồng ngoại với chân 11, Nút nhấn trái với chân 7, nútt nhấn phải với chân 8, cảm biến ánh sáng với chân A0, màn hình OLED 0,96 inch.
      Ngoài ra, tôi sử dụng module L298N để điều khiển động cơ, với các chân điều khiển cho động cơ trái lần lượt là 5 và 12, động cơ phải là 6 và 13.
      Phần thiết lập chương trình của tôi cho các linh kiện như sau:
      // Thiết lập màn hình Oled
      #include "Arduino-IRremote-master/IRremote.h"
      #include "src/Adafruit_SSD1306.h"
      #include "src/Adafruit_GFX.h"
      #include "src/Wire.h"
      #include "src/SPI.h"
      #define WIDTH 128
      #define HEIGTH 64
      #define OLED_RESET 4
      #define SCREEN_ADDRESS 0x3C
      Adafruit_SSD1306 display(WIDTH, HEIGTH, &Wire, OLED_RESET);

      #include <Arduino.h>
      #include <Wire.h>
      #include <SoftwareSerial.h>

      // thiết lập cảm biến ánh sáng
      int cambienanhsangA0 = A0;

      // Thiết lập đèn LED
      byte ledPin11 = 11; 

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

      IRrecv irrecv(11);
      decode_results results;

      // Thiết lập nút nhấn pull_up
      #define BUTTON_LEFT 7
      #define BUTTON_RIGHT 8

      // Thiết lập động cơ trái
      #define INM11        5
      #define INM12        12

      // Thiết lập động cơ phải
      #define INM21        6
      #define INM22        13

      Bạn là một chuyên gia lập trình C và có khả năng sư phạm cho học sinh, từ các dữ liệu trên, hãy thực hiện yêu cầu của tôi:
      Tạo một sketch Arduino hoàn chỉnh cho board Arduino uno với màn hình OLED SSD1306 (128x64) để ${input}. Sketch phải bao gồm tất cả thư viện cần thiết, hàm setup và loop được cấu hình đúng.
      Giải thích đơn giản ngắn gọn về nguyên lý chung của ý tưởng: ${input}
    `;
  }
}
