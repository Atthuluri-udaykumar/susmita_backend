import { randomInt } from "node:crypto";

export class RandomUtils {
    public static generatePin(digits: number): string {

        const buf = randomInt(0, (10 ** digits) -1);
        
        return buf.toString().padStart( digits, "0");
    }

    public static generateToken(digits: number): string {

        const buf = randomInt(0, (36 ** digits) -1);
        
        return buf.toString(36).padStart( digits, "0").toUpperCase();
    }

    public static generateTrasactionId(): string {
        return this.generateToken(6) + this.generateToken(6);
    }

}