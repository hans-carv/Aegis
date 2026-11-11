import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class FileEncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16;
  private static readonly KEY = Buffer.from(
    (process.env.FILE_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef').substring(0, 64),
    'hex'
  );
  private static readonly STORAGE_DIR = path.resolve(
    process.env.STORAGE_PATH || './uploads_encrypted'
  );

  private static ensureStorageDirExists(): void {
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
    }
  }

  static encryptAndStore(buffer: Buffer, originalFilename: string) {
    this.ensureStorageDirExists();

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

    const hashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const encryptedFileName = `${crypto.randomUUID()}-${Date.now()}.enc`;
    const encryptedFilePath = path.join(this.STORAGE_DIR, encryptedFileName);

    fs.writeFileSync(encryptedFilePath, encrypted);

    return {
      rutaCifrada: encryptedFilePath,
      iv: iv.toString('hex'),
      hashSha256,
      tamanoBytes: buffer.length,
    };
  }

  static decryptFile(rutaCifrada: string, ivHex: string): Buffer {
    if (!fs.existsSync(rutaCifrada)) {
      throw { status: 404, message: 'El archivo cifrado no existe en el almacenamiento.' };
    }

    const encryptedData = fs.readFileSync(rutaCifrada);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv);
    
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }
}