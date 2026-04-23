import { describe, it, expect } from 'vitest';
import { validate, gastoSchema, ventaSchema, postulanteSchema } from './forms.schema';

// ── gastoSchema ──────────────────────────────────────────────────────────────

describe('gastoSchema', () => {
  const valid = { description: 'Hosting anual', amount: '150', date: '2026-04-21' };

  it('acepta datos válidos', () => {
    const { ok, data } = validate(gastoSchema, valid);
    expect(ok).toBe(true);
    expect(data.amount).toBe(150);        // coercionado a número
    expect(data.description).toBe('Hosting anual');
  });

  it('rechaza descripción vacía', () => {
    const { ok, errors } = validate(gastoSchema, { ...valid, description: '' });
    expect(ok).toBe(false);
    expect(errors.description).toBeDefined();
  });

  it('rechaza importe negativo', () => {
    const { ok, errors } = validate(gastoSchema, { ...valid, amount: '-10' });
    expect(ok).toBe(false);
    expect(errors.amount).toBeDefined();
  });

  it('rechaza importe cero', () => {
    const { ok, errors } = validate(gastoSchema, { ...valid, amount: '0' });
    expect(ok).toBe(false);
    expect(errors.amount).toBeDefined();
  });

  it('rechaza fecha en formato incorrecto', () => {
    const { ok, errors } = validate(gastoSchema, { ...valid, date: '21/04/2026' });
    expect(ok).toBe(false);
    expect(errors.date).toBeDefined();
  });

  it('rechaza fecha inválida', () => {
    const { ok, errors } = validate(gastoSchema, { ...valid, date: '2026-13-99' });
    expect(ok).toBe(false);
    expect(errors.date).toBeDefined();
  });

  it('trim a la descripción', () => {
    const { ok, data } = validate(gastoSchema, { ...valid, description: '  Nómina  ' });
    expect(ok).toBe(true);
    expect(data.description).toBe('Nómina');
  });
});

// ── ventaSchema ──────────────────────────────────────────────────────────────

describe('ventaSchema', () => {
  const valid = {
    clienteNombre: 'Juan García',
    clienteEmail: 'juan@ejemplo.com',
    servicio: 'Landing Page',
    importe: '300',
  };

  it('acepta datos válidos', () => {
    const { ok, data } = validate(ventaSchema, valid);
    expect(ok).toBe(true);
    expect(data.importe).toBe(300);
  });

  it('rechaza nombre de cliente demasiado corto', () => {
    const { ok, errors } = validate(ventaSchema, { ...valid, clienteNombre: 'J' });
    expect(ok).toBe(false);
    expect(errors.clienteNombre).toBeDefined();
  });

  it('rechaza email malformado', () => {
    const { ok, errors } = validate(ventaSchema, { ...valid, clienteEmail: 'no-es-email' });
    expect(ok).toBe(false);
    expect(errors.clienteEmail).toBeDefined();
  });

  it('rechaza importe 0', () => {
    const { ok, errors } = validate(ventaSchema, { ...valid, importe: '0' });
    expect(ok).toBe(false);
    expect(errors.importe).toBeDefined();
  });

  it('acepta teléfono opcional vacío', () => {
    const { ok } = validate(ventaSchema, { ...valid, clienteTelefono: '' });
    expect(ok).toBe(true);
  });

  it('acepta teléfono internacional válido', () => {
    const { ok } = validate(ventaSchema, { ...valid, clienteTelefono: '+52 55 1234 5678' });
    expect(ok).toBe(true);
  });

  it('rechaza teléfono con menos de 7 dígitos', () => {
    const { ok, errors } = validate(ventaSchema, { ...valid, clienteTelefono: '123' });
    expect(ok).toBe(false);
    expect(errors.clienteTelefono).toBeDefined();
  });

  it('rechaza importe superior al máximo', () => {
    const { ok, errors } = validate(ventaSchema, { ...valid, importe: '2000000' });
    expect(ok).toBe(false);
    expect(errors.importe).toBeDefined();
  });
});

// ── postulanteSchema ─────────────────────────────────────────────────────────

describe('postulanteSchema', () => {
  const valid = {
    nombre: 'Ana López',
    email: 'ana@ejemplo.com',
    telefono: '+52 55 9876 5432',
  };

  it('acepta postulante válido', () => {
    const { ok } = validate(postulanteSchema, valid);
    expect(ok).toBe(true);
  });

  it('rechaza sin nombre', () => {
    const { ok, errors } = validate(postulanteSchema, { ...valid, nombre: '' });
    expect(ok).toBe(false);
    expect(errors.nombre).toBeDefined();
  });

  it('acepta URL de website válida', () => {
    const { ok } = validate(postulanteSchema, { ...valid, website: 'https://mi-sitio.com' });
    expect(ok).toBe(true);
  });

  it('rechaza URL malformada', () => {
    const { ok, errors } = validate(postulanteSchema, { ...valid, website: 'no-es-url' });
    expect(ok).toBe(false);
    expect(errors.website).toBeDefined();
  });
});
