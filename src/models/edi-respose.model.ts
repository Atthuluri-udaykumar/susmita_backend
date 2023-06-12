import { Any, JsonObject, JsonProperty } from "json2typescript";
import { nullable } from "../utils/model.util";

@JsonObject('EdiResponse')
export class EdiResponse {
  @JsonProperty('status', Number)
  public status: number = 200;
 
  @JsonProperty('errors', Any)
  public errors: any = undefined;

  @JsonProperty('result', Any, true, nullable)
  public result: any = undefined;

  @JsonProperty('timestamp', Any)
  public timestamp: any = undefined;

  }