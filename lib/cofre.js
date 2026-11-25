import 'server-only';
import crypto from 'crypto';

// Criptografia das senhas dos clientes (AES-256-GCM).
// A chave fica SÓ na Vercel (variável COFRE_CHAVE). O banco guarda apenas o texto embaralhado:
// mesmo que alguém acesse o Supabase, não consegue ler as senhas sem essa chave.

function chave() {
  const bruta = process.env.COFRE_CHAVE || '';
  const buf = Buffer.from(bruta.trim(), 'base64');
  return buf.length === 32 ? buf : null;
}

export function cofreConfigurado() {
  return chave() !== null;
}

export function cifrar(texto) {
  const k = chave();
  if (!k) throw new Error('Cofre não configurado (falta a COFRE_CHAVE na Vercel).');
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', k, iv);
  const dados = Buffer.concat([c.update(String(texto), 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), dados.toString('base64')].join('.');
}

export function decifrar(cifrado) {
  const k = chave();
  if (!k) throw new Error('Cofre não configurado (falta a COFRE_CHAVE na Vercel).');
  const [versao, iv, tag, dados] = String(cifrado).split('.');
  if (versao !== 'v1') throw new Error('Formato desconhecido.');
  const d = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(dados, 'base64')), d.final()]).toString('utf8');
}
