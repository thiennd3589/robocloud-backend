import { service} from '@loopback/core';
import { post, requestBody} from '@loopback/rest';
import { AuthenticationService } from '../services/authentication.service';

const basePath = "/authentication";

export class AuthenticationController {
  constructor(
    @service(AuthenticationService) private authenticationService: AuthenticationService
  ) {}

  @post(`${basePath}/register`)
  async register(
    @requestBody({
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              fullName: {
                type: "string",
              },
              email: {
                type: "string",
              },
              password: {
                type: "string",
              }
            },
            required: ["fullName", "email", "password"]
          }
        }
      }
    }) body: {
      email: string,
      password: string,
      fullName: string
    },
  ) {
    return this.authenticationService.registerUser(body)
  }

  @post(`${basePath}/login`)
  async login(
    @requestBody({
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              email: {
                type: "string",
              },
              password: {
                type: "string"
              }
            },
            required: ["email", "password"]
          }
        }
      }
    }) body: {email: string, password: string}
  ) {
    const {email, password} = body;
    return this.authenticationService.loginByEmail(email, password);
  }
}
