import { logoAgencia } from '@/lib/supabase';
import FormLogin from '@/components/FormLogin';

export const dynamic = 'force-dynamic';

export default async function Login() {
  const logoUrl = await logoAgencia().catch(() => null);
  return <FormLogin logoUrl={logoUrl} />;
}
