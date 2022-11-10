import { hashSync, compareSync } from "bcrypt";
import { TextDecoder, TextEncoder } from "util";
export class Crypt {
  private static get saltRounds() {
    return 15;
  }
  public static matchesEncrypted(
    rawcontent: string,
    encryptedContent: string
  ): boolean {
    return compareSync(rawcontent, this.decryptToHash(encryptedContent));
  }
  public static encrypt(content: string): string {
    const hashedinput = hashSync(content, this.saltRounds);
    const bytesInput = this.toBytes(hashedinput);
    const xorInput = this.xor(bytesInput);
    return this.toBase64(xorInput);
  }
  private static decryptToHash(encrypted: string): string {
    const decrypttoB64 = this.fromBase64(encrypted);
    const decryptedXOR = this.xor(decrypttoB64);
    const decryptedBytes = this.fromBytes(decryptedXOR);
    return decryptedBytes;
  }
  private static toBytes(content: string): Uint8Array {
    return new TextEncoder().encode(content);
  }
  private static fromBytes(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }
  private static xor(bytes: Uint8Array): Uint8Array {
    return bytes.map((byte) => byte ^ 129);
  }
  private static toBase64(bytes: Uint8Array) {
    return Buffer.from(bytes).toString("base64");
  }
  private static fromBase64(base64: string): Uint8Array {
    return Buffer.from(base64, "base64");
  }
}
