import { supabase } from '@/lib/supabase';
import type { Certification, CertificationInsert, CertificationUpdate } from '@/types/learner.types';

export const certificationsService = {
  async getCertifications(): Promise<Certification[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) return data as Certification[];
    }

    try {
      const res = await fetch('/api/skillpath/certifications');
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async addCertification(cert: {
    name?: string;
    certificationName?: string;
    issuingOrg?: string;
    issuingOrganization?: string;
    credentialId?: string;
    credentialUrl?: string;
    issueDate?: string;
    expiryDate?: string;
    documentPath?: string;
  }): Promise<Certification | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const certName = cert.certificationName || cert.name || 'Professional Certification';
    const org = cert.issuingOrganization || cert.issuingOrg || null;

    if (user) {
      const insertData: CertificationInsert = {
        user_id: user.id,
        certification_name: certName,
        issuing_organization: org,
        credential_id: cert.credentialId || null,
        credential_url: cert.credentialUrl || null,
        issue_date: cert.issueDate || null,
        expiry_date: cert.expiryDate || null,
        document_path: cert.documentPath || null,
        verification_status: 'verified'
      };

      const { data, error } = await supabase
        .from('certifications')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Certification;
    }

    const res = await fetch('/api/skillpath/certifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        certificationName: certName,
        name: certName,
        issuingOrganization: org,
        issuingOrg: org,
        credentialUrl: cert.credentialUrl
      })
    });
    const json = await res.json();
    return json.data || null;
  },

  async updateCertification(id: string, updates: CertificationUpdate): Promise<Certification | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('certifications')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Certification;
    }

    return null;
  },

  async deleteCertification(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    }

    const res = await fetch(`/api/skillpath/certifications?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  }
};
