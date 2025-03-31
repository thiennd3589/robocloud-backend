import {BindingScope, injectable} from '@loopback/core';
import axios from 'axios';

@injectable({scope: BindingScope.SINGLETON})
export class LlmService {
  private llmKey: string;
  private baseApi: string;
  private defaultPrompt = `Tôi dùng màn hình oled và arduino, với thiết lập: 
  #include "Adafruit_SSD1306.h"
  #include "Adafruit_GFX.h"
  #include "SPI.h"
  
  #include <Arduino.h>
  #include <Wire.h>
  #include <SoftwareSerial.h>
  
  #define WIDTH 128
  #define HEIGTH 64
  #define OLED_RESET 4
  #define SCREEN_ADDRESS 0x3C
  
  Adafruit_SSD1306 display(WIDTH, HEIGTH, &Wire, OLED_RESET);
  `;
  constructor() {
    this.llmKey = process.env.LLM_API_KEY ?? '';
    this.baseApi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.llmKey}`;
  }

  async generateContent(input: string) {
    const finalInput = `Trả lời bằng Tiếng Việt. ${this.defaultPrompt} Tạo một sketch Arduino hoàn chỉnh cho board Arduino uno với màn hình OLED SSD1306 (128x64) để ${input}. Sketch phải bao gồm tất cả thư viện cần thiết, hàm setup và loop được cấu hình đúng."`;
    return axios.post(this.baseApi, {
      contents: [
        {
          parts: [{text: finalInput}],
        },
      ],
    });
  }
}
