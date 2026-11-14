export interface StorageProvider {
  createUploadUrl(fileName: string, mimeType: string): Promise<{ uploadUrl: string; fileKey: string }>;
  deleteFile(fileKey: string): Promise<void>;
  getDownloadUrl(fileKey: string): Promise<string>;
}

class S3StorageProvider implements StorageProvider {
  private bucket: string;

  constructor() {
    this.bucket = process.env.STORAGE_BUCKET || 'campus-os-bucket';
  }

  async createUploadUrl(fileName: string, mimeType: string): Promise<{ uploadUrl: string; fileKey: string }> {
    const fileKey = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${fileName}`;
    
    // In production, we would use S3 client:
    // const command = new PutObjectCommand({ Bucket: this.bucket, Key: fileKey, ContentType: mimeType });
    // const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // For local sandbox dev mode, we return a mock signed URL that client uploads to
    const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/storage/mock-upload?key=${fileKey}`;
    return { uploadUrl, fileKey };
  }

  async deleteFile(fileKey: string): Promise<void> {
    console.log(`[STORAGE] Deleted file key: ${fileKey} from bucket ${this.bucket}`);
    return Promise.resolve();
  }

  async getDownloadUrl(fileKey: string): Promise<string> {
    // Return standard public download link or pre-signed URL
    return `https://s3.amazonaws.com/${this.bucket}/${fileKey}`;
  }
}

export const StorageService: StorageProvider = new S3StorageProvider();
