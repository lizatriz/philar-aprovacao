import { redirect } from 'next/navigation';
import { logoAgencia } from '@/lib/supabase';
import { membroAtual, equipeVazia } from '@/lib/auth';
import FormLogin from '@/components/FormLogin';

export const dynamic = 'force-dynamic';

export default async function Login() {
  if (await membroAtual()) redirect('/admin');
  const [logoUrl, primeiraVez] = await Promise.all([logoAgencia().catch(() => null), equipeVazia()]);
  return <FormLogin logoUrl={logoUrl} primeiraVez={primeiraVez} />;
}
