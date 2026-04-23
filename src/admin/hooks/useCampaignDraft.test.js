import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { isMeaningfulDraft, useCampaignDraft } from './useCampaignDraft';

const DRAFT_KEY = 'delegaweb:nuevacampana:draft:v1';

const INITIAL = {
  company_name: '', offer: '', ideal_client: '', differentiator: '',
  price_range: '', sales_method: '', name: '', interests: [],
  primary_text: '', headline: '', description: '',
};

// ── isMeaningfulDraft (función pura) ─────────────────────────────────────────

describe('isMeaningfulDraft', () => {
  it('devuelve false para null', () => expect(isMeaningfulDraft(null)).toBe(false));
  it('devuelve false para objeto vacío', () => expect(isMeaningfulDraft(INITIAL)).toBe(false));

  it('devuelve true si company_name tiene contenido', () => {
    expect(isMeaningfulDraft({ ...INITIAL, company_name: 'Acme' })).toBe(true);
  });

  it('devuelve true si hay intereses', () => {
    expect(isMeaningfulDraft({ ...INITIAL, interests: ['Marketing'] })).toBe(true);
  });

  it('ignora strings solo con espacios', () => {
    expect(isMeaningfulDraft({ ...INITIAL, company_name: '   ' })).toBe(false);
  });

  it('devuelve true si hay price_range', () => {
    expect(isMeaningfulDraft({ ...INITIAL, price_range: '$100 - $500 USD' })).toBe(true);
  });
});

// ── useCampaignDraft ─────────────────────────────────────────────────────────

describe('useCampaignDraft', () => {
  let formData;
  let setFormData;
  let setStep;

  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();

    formData = { ...INITIAL };
    setFormData = vi.fn((updater) => {
      if (typeof updater === 'function') formData = updater(formData);
      else formData = updater;
    });
    setStep = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  const renderDraft = (overrides = {}) =>
    renderHook(() => useCampaignDraft({
      formData: overrides.formData ?? formData,
      step: overrides.step ?? 1,
      setFormData,
      setStep,
    }));

  it('draftSavedAt es null al iniciar sin borrador', () => {
    const { result } = renderDraft();
    expect(result.current.draftSavedAt).toBeNull();
    expect(result.current.hasRestoredDraft).toBe(false);
  });

  it('restaura borrador guardado en sessionStorage al montar', () => {
    const savedData = { ...INITIAL, company_name: 'DelegaWeb' };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      formData: savedData,
      step: 2,
      savedAt: '2026-04-21T10:00:00.000Z',
    }));

    renderDraft();

    expect(setFormData).toHaveBeenCalled();
    expect(setStep).toHaveBeenCalledWith(2);
  });

  it('no restaura borrador si no es significativo', () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      formData: INITIAL,
      step: 1,
      savedAt: '2026-04-21T10:00:00.000Z',
    }));

    renderDraft();

    expect(setFormData).not.toHaveBeenCalled();
    expect(setStep).not.toHaveBeenCalled();
  });

  it('clearDraft elimina el borrador y resetea estado', () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      formData: { ...INITIAL, company_name: 'Test' },
      step: 1,
      savedAt: new Date().toISOString(),
    }));

    const { result } = renderDraft();

    act(() => { result.current.clearDraft(); });

    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(result.current.draftSavedAt).toBeNull();
    expect(result.current.hasRestoredDraft).toBe(false);
  });

  it('autosave guarda en sessionStorage después del debounce', async () => {
    const { rerender } = renderDraft({
      formData: { ...INITIAL, company_name: 'Acme' },
    });

    // Avanzar el debounce
    act(() => { vi.advanceTimersByTime(600); });

    const stored = sessionStorage.getItem(DRAFT_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored);
    expect(parsed.formData.company_name).toBe('Acme');

    void rerender; // suppress warning
  });

  it('autosave elimina el borrador si formData queda vacío', () => {
    // Primero guardamos un borrador
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      formData: { ...INITIAL, company_name: 'Acme' },
      step: 1,
      savedAt: new Date().toISOString(),
    }));

    // Rendericamos con formData vacío
    renderDraft({ formData: INITIAL });
    act(() => { vi.advanceTimersByTime(600); });

    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});
