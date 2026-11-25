// Formatos de pauta e como cada um chama seus blocos de texto
export const FORMATOS_PAUTA = {
  carrossel: { nome: 'Carrossel', bloco: 'Slide', dica: 'Texto que vai na arte deste slide' },
  feed: { nome: 'Post único', bloco: 'Arte', dica: 'Texto que vai na arte' },
  reels: { nome: 'Reels / TikTok', bloco: 'Cena', dica: 'O que acontece / o que é falado / texto na tela' },
  stories: { nome: 'Stories', bloco: 'Tela', dica: 'Texto da tela, enquete, link…' },
};

export const STATUS_PAUTA = {
  rascunho: 'Rascunho',
  copy_pronta: 'Copy pronta',
  em_design: 'Em design',
  design_pronto: 'Design pronto',
};

export const OBJETIVOS = ['Atrair', 'Engajar', 'Relacionamento', 'Converter', 'Institucional'];

export const APROVACAO_COPY = {
  pendente: 'Aguardando aprovação',
  aprovada: 'Copy aprovada',
  ajuste: 'Ajuste pedido',
};

// Lê os pilares escritos na Linha editorial (um por linha, aceita "- " e "• ")
export function extrairPilares(texto) {
  return String(texto || '')
    .split(/\n|;/)
    .map((l) => l.replace(/^\s*[-•*\d.)]+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 20);
}

// Cor estável para cada pilar (mesmo nome = mesma cor)
const PALETA = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
export function corPilar(nome) {
  let h = 0;
  for (const c of String(nome).toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}

export function ordenarPautas(lista) {
  return [...lista].sort((a, b) => {
    if (!a.data && !b.data) return (b.criado_em || '').localeCompare(a.criado_em || '');
    if (!a.data) return 1;
    if (!b.data) return -1;
    return a.data.localeCompare(b.data);
  });
}
