import { useState, useEffect, useRef } from 'react';

const DRAFT_STORAGE_KEY = 'delegaweb:nuevacampana:draft:v1';
const DRAFT_DEBOUNCE_MS = 500;

export interface CampaignFormData {
  company_name?:       string;
  offer?:              string;
  ideal_client?:       string;
  differentiator?:     string;
  price_range?:        string;
  sales_method?:       string;
  name?:               string;
  interests?:          string[];
  primary_text?:       string;
  headline?:           string;
  description?:        string;
  business_profile_id?: string;
  [key: string]:       unknown;
}

export function isMeaningfulDraft(data: CampaignFormData | null | undefined): boolean {
  if (!data) return false;
  return Boolean(
    data.company_name?.trim()   ||
    data.offer?.trim()          ||
    data.ideal_client?.trim()   ||
    data.differentiator?.trim() ||
    data.price_range            ||
    data.sales_method           ||
    data.name?.trim()           ||
    (data.interests && data.interests.length > 0) ||
    data.primary_text?.trim()   ||
    data.headline?.trim()       ||
    data.description?.trim(),
  );
}

interface UseCampaignDraftProps {
  formData:    CampaignFormData;
  step:        number;
  setFormData: (updater: CampaignFormData | ((prev: CampaignFormData) => CampaignFormData)) => void;
  setStep:     (step: number) => void;
}

/**
 * Maneja la persistencia del borrador de NuevaCampana en sessionStorage.
 */
export function useCampaignDraft({ formData, step, setFormData, setStep }: UseCampaignDraftProps) {
  const [draftSavedAt, setDraftSavedAt]       = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const hasHydratedRef   = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rehidratar al montar
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { formData: CampaignFormData; step: number; savedAt: string };
        if (parsed?.formData && isMeaningfulDraft(parsed.formData)) {
          setFormData(prev => ({ ...prev, ...parsed.formData }));
          if (typeof parsed.step === 'number' && parsed.step >= 1 && parsed.step <= 5) {
            setStep(parsed.step);
          }
          setDraftSavedAt(parsed.savedAt ?? null);
          setHasRestoredDraft(true);
        }
      }
    } catch (err) {
      console.warn('No se pudo leer el borrador de campaña:', err);
    } finally {
      hasHydratedRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave con debounce
  useEffect(() => {
    if (!hasHydratedRef.current) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      try {
        const { business_profile_id: _pid, ...formToPersist } = formData;
        if (!isMeaningfulDraft(formToPersist)) {
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
          setDraftSavedAt(null);
          return;
        }
        const savedAt = new Date().toISOString();
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ formData: formToPersist, step, savedAt }));
        setDraftSavedAt(savedAt);
      } catch (err) {
        console.warn('No se pudo guardar el borrador de campaña:', err);
      }
    }, DRAFT_DEBOUNCE_MS);

    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [formData, step]);

  const clearDraft = () => {
    try { sessionStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* noop */ }
    setDraftSavedAt(null);
    setHasRestoredDraft(false);
  };

  const discardDraft = (INITIAL_FORM_DATA: CampaignFormData) => {
    if (!confirm('¿Descartar el borrador guardado y empezar desde cero?')) return;
    clearDraft();
    setFormData(INITIAL_FORM_DATA);
    setStep(1);
  };

  return { draftSavedAt, hasRestoredDraft, clearDraft, discardDraft };
}
