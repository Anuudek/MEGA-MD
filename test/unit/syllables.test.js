import { describe, it, expect } from 'vitest';
import { silabificar, normalizeSyllable } from '../../lib/syllables.js';

describe('silabificar', () => {
    const casos = {
        casa: ['ca', 'sa'],
        'música': ['mú', 'si', 'ca'],
        'saída': ['sa', 'í', 'da'],
        guitarra: ['gui', 'tar', 'ra'],
        praia: ['prai', 'a'],
        chave: ['cha', 've'],
        abacaxi: ['a', 'ba', 'ca', 'xi'],
        quadro: ['qua', 'dro'],
        sapo: ['sa', 'po'],
        pote: ['po', 'te'],
        teto: ['te', 'to'],
    };

    for (const [palavra, esperado] of Object.entries(casos)) {
        it(`separa "${palavra}" em ${JSON.stringify(esperado)}`, () => {
            expect(silabificar(palavra)).toEqual(esperado);
        });
    }
});

describe('normalizeSyllable', () => {
    it('remove acentos e deixa minúsculo', () => {
        expect(normalizeSyllable('SÃ')).toBe('sa');
        expect(normalizeSyllable('Ção')).toBe('cao');
        expect(normalizeSyllable('mú')).toBe('mu');
    });
});

describe('encadeamento de sílabas (shiritori)', () => {
    it('última sílaba de uma palavra bate com a primeira da próxima', () => {
        const ultima = (p) => normalizeSyllable(silabificar(p).at(-1));
        const primeira = (p) => normalizeSyllable(silabificar(p)[0]);

        expect(ultima('casa')).toBe(primeira('sapo'));
        expect(ultima('sapo')).toBe(primeira('pote'));
        expect(ultima('pote')).toBe(primeira('teto'));
    });
});
