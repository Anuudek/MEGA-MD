const VOGAIS = 'aeiouáàâãéêíóôõúAEIOUÁÀÂÃÉÊÍÓÔÕÚ';
const FRACAS = 'iuIU';
const HIATO_MARCADORES = 'íÍúÚ';
const DIGRAFOS_INSEPARAVEIS = ['lh', 'nh', 'ch', 'qu', 'gu'];
const ENCONTROS_INSEPARAVEIS = ['br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'vr', 'bl', 'cl', 'fl', 'gl', 'pl'];
const TRITONGOS = ['uai', 'uei', 'uou', 'iau', 'uau'];

function isVogal(ch) {
    return VOGAIS.includes(ch);
}

function isFraca(ch) {
    return FRACAS.includes(ch);
}

function isHiatoMarcador(ch) {
    return HIATO_MARCADORES.includes(ch);
}

function ehDitongoNasal(par) {
    const p = par.toLowerCase();
    return p === 'ão' || p === 'ãe' || p === 'õe';
}

function tokenizar(palavra) {
    const tokens = [];
    const n = palavra.length;
    let i = 0;
    while (i < n) {
        const ch = palavra[i];
        if (isVogal(ch)) {
            let grupo = ch;
            let j = i + 1;
            if (j < n && isVogal(palavra[j])) {
                const podeFundir = !isHiatoMarcador(palavra[j]) &&
                    (isFraca(ch) || isFraca(palavra[j]) || ehDitongoNasal(ch + palavra[j]));
                if (podeFundir) {
                    grupo += palavra[j];
                    j++;
                    if (j < n && isVogal(palavra[j])) {
                        const tentativa = (grupo + palavra[j]).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
                        if (TRITONGOS.includes(tentativa)) {
                            grupo += palavra[j];
                            j++;
                        }
                    }
                }
            }
            tokens.push({ tipo: 'V', texto: grupo });
            i = j;
        }
        else {
            const par = palavra.substr(i, 2).toLowerCase();
            if (i + 1 < n && (DIGRAFOS_INSEPARAVEIS.includes(par) || ENCONTROS_INSEPARAVEIS.includes(par))) {
                tokens.push({ tipo: 'C', texto: palavra.substr(i, 2) });
                i += 2;
            }
            else {
                tokens.push({ tipo: 'C', texto: ch });
                i += 1;
            }
        }
    }
    return tokens;
}

function agruparSilabas(tokens) {
    const nucleoIdx = tokens.map((t, i) => (t.tipo === 'V' ? i : -1)).filter((i) => i !== -1);
    if (nucleoIdx.length === 0) {
        return [tokens.map((t) => t.texto).join('')];
    }

    const silabas = nucleoIdx.map(() => ({ onset: '', nucleo: '', coda: '' }));
    nucleoIdx.forEach((idx, k) => {
        silabas[k].nucleo = tokens[idx].texto;
    });

    for (let i = 0; i < nucleoIdx[0]; i++) {
        silabas[0].onset += tokens[i].texto;
    }

    for (let i = nucleoIdx[nucleoIdx.length - 1] + 1; i < tokens.length; i++) {
        silabas[silabas.length - 1].coda += tokens[i].texto;
    }

    for (let k = 0; k < nucleoIdx.length - 1; k++) {
        const grupo = tokens.slice(nucleoIdx[k] + 1, nucleoIdx[k + 1]);
        if (grupo.length === 0) {
            continue;
        }
        else if (grupo.length === 1) {
            silabas[k + 1].onset += grupo[0].texto;
        }
        else {
            const ultimo = grupo[grupo.length - 1];
            const resto = grupo.slice(0, -1);
            silabas[k].coda += resto.map((t) => t.texto).join('');
            silabas[k + 1].onset += ultimo.texto;
        }
    }

    return silabas.map((s) => s.onset + s.nucleo + s.coda);
}

export function silabificar(palavra) {
    return agruparSilabas(tokenizar(palavra));
}

export function normalizeSyllable(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
