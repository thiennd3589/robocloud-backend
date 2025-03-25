import { belongsTo, model, property } from "@loopback/repository";
import { User } from "./user.model";
import { BaseModel } from "./base.model";

@model({
  settings: {
    strict: false
  }
})
export class UserCredential extends BaseModel {
  @belongsTo(()=>User)
  userId: string

  @property({
    type: "string"
  })
  password: string
};

export interface UserCredentialRelations {}