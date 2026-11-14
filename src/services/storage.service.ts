import { supabase } from '@/lib/supabase';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const storageService = {
  async uploadAvatar(file: File): Promise<{ path: string; signedUrl: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required to upload avatars.');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.');
    }
    if (file.size > MAX_AVATAR_SIZE) {
      throw new Error('File size exceeds the 5MB limit.');
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    // Generate signed URL (valid for 1 year = 31536000 seconds)
    const { data: signData, error: signError } = await supabase.storage
      .from('profile-avatars')
      .createSignedUrl(filePath, 31536000);

    if (signError) throw signError;

    return {
      path: filePath,
      signedUrl: signData.signedUrl
    };
  },

  async uploadCertificationDoc(file: File): Promise<{ path: string; signedUrl: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required to upload certification documents.');

    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only PDF, DOCX, JPEG, and PNG files are allowed.');
    }
    if (file.size > MAX_DOC_SIZE) {
      throw new Error('File size exceeds the 15MB limit.');
    }

    const fileExt = file.name.split('.').pop() || 'pdf';
    const filePath = `${user.id}/cert_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('certification-documents')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data: signData, error: signError } = await supabase.storage
      .from('certification-documents')
      .createSignedUrl(filePath, 604800); // 7 days

    if (signError) throw signError;

    return {
      path: filePath,
      signedUrl: signData.signedUrl
    };
  },

  async uploadProjectAttachment(file: File): Promise<{ path: string; signedUrl: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required to upload project attachments.');

    if (file.size > MAX_DOC_SIZE) {
      throw new Error('File size exceeds the 15MB limit.');
    }

    const fileExt = file.name.split('.').pop() || 'zip';
    const filePath = `${user.id}/project_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('project-attachments')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data: signData, error: signError } = await supabase.storage
      .from('project-attachments')
      .createSignedUrl(filePath, 604800);

    if (signError) throw signError;

    return {
      path: filePath,
      signedUrl: signData.signedUrl
    };
  },

  async getSignedUrl(bucket: 'profile-avatars' | 'certification-documents' | 'project-attachments', path: string, expiresInSeconds: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
  },

  async deleteFile(bucket: 'profile-avatars' | 'certification-documents' | 'project-attachments', path: string): Promise<boolean> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  }
};
