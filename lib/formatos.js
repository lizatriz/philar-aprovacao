export const FORMATOS = {
  feed: 'Post de feed',
  carrossel: 'Carrossel',
  reels: 'Reels / TikTok',
  stories: 'Stories',
};

export const STATUS = {
  pendente: 'Aguardando aprovação',
  ajuste: 'Ajuste solicitado',
  aprovado: 'Aprovado',
};

// "2026-11-20" -> "sex, 20 de nov." (sem erro de fuso horário)
export function formatarData(iso) {
  if (!iso) return 'Sem data definida';
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export function formatarHora(ts) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}
