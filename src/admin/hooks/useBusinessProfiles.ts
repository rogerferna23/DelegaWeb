import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { CampaignFormData } from './useCampaignDraft';

export interface BusinessProfile {
  id: string;
  company_name: string;
  offer: string;
  ideal_client: string;
  differentiator: string;
  price_range: string;
  sales_method: string;
  type?: string;
  [key: string]: unknown;
}

interface UseBusinessProfilesProps {
  formData:    CampaignFormData;
  setFormData: (updater: CampaignFormData | ((prev: CampaignFormData) => CampaignFormData)) => void;
}

/**
 * Gestiona los perfiles de negocio para el planificador de campaña.
 */
export function useBusinessProfiles({ formData, setFormData }: UseBusinessProfilesProps) {
  const toast = useToast();
  const [profiles, setProfiles]               = useState<BusinessProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isSavingProfile, setIsSavingProfile]     = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoadingProfiles(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('useBusinessProfiles: No se encontró usuario al cargar perfiles.');
        return;
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .or('type.eq.campaign,type.is.null')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProfiles((data ?? []) as BusinessProfile[]);
    } catch (err) {
      console.error('Error cargando perfiles:', err);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  const handleSelectProfile = useCallback((profile: BusinessProfile) => {
    setFormData(prev => ({
      ...prev,
      business_profile_id: profile.id,
      company_name:        profile.company_name,
      offer:               profile.offer,
      ideal_client:        profile.ideal_client,
      differentiator:      profile.differentiator ?? '',
      price_range:         profile.price_range,
      sales_method:        profile.sales_method,
      objective: profile.sales_method === 'whatsapp'
        ? 'Interacción (Mensajes a WhatsApp)'
        : prev.objective,
    }));
  }, [setFormData]);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    try {
      setIsSavingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const profileData = {
        user_id:       user.id,
        company_name:  formData.company_name,
        offer:         formData.offer,
        ideal_client:  formData.ideal_client,
        differentiator: formData.differentiator,
        price_range:   formData.price_range,
        sales_method:  formData.sales_method,
        type:          'campaign',
      };

      const existingByName = profiles.find(
        p => p.company_name.toLowerCase() === (formData.company_name ?? '').toLowerCase(),
      );

      let result;
      if (existingByName) {
        result = await supabase
          .from('business_profiles')
          .update(profileData)
          .eq('id', existingByName.id)
          .select();
      } else {
        result = await supabase
          .from('business_profiles')
          .insert([profileData])
          .select();
      }

      if (result.error) throw result.error;

      if (result.data?.[0]) {
        setFormData(prev => ({ ...prev, business_profile_id: (result.data![0] as BusinessProfile).id }));
        await fetchProfiles();
      }
      return true;
    } catch (err) {
      console.error('Error guardando perfil:', err);
      toast.error(`Error: ${(err as Error).message || 'No se pudo guardar el perfil del negocio'}`);
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  }, [formData, profiles, setFormData, fetchProfiles, toast]);

  return { profiles, isLoadingProfiles, isSavingProfile, fetchProfiles, handleSelectProfile, saveProfile };
}
