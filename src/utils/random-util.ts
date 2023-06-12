import { randomInt } from "node:crypto";

export class RandomUtils {
    public static generatePin(digits: number): string {

        const buf = randomInt(0, (10 ** digits) -1);
        
        return buf.toString().padStart( digits, "0");
    }
}