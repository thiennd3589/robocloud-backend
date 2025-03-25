import { Entity, property } from "@loopback/repository";

export abstract class BaseModel extends Entity {
  @property({
    type: "string",
    mongodb: { dataType: "ObjectID" },
    id: true,
  })
  id: string;
  
  @property({
    type: "Date",
  })
  createdAt: Date;

  @property({
    type: "Date",
  })
  updatedAt: Date;
}