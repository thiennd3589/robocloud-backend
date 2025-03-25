import {BindingScope, injectable} from '@loopback/core';
import axios from 'axios';

@injectable({scope: BindingScope.SINGLETON})
export class LlmService {
  private llmKey: string;
  private baseApi: string;
  constructor() {
    this.llmKey = process.env.LLM_API_KEY ?? '';
    this.baseApi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.llmKey}`;
  }

  async generateContent(input: string) {
    return axios.post(this.baseApi, {
      contents: [
        {
          parts: [{text: input}],
        },
      ],
    });
  }
}
