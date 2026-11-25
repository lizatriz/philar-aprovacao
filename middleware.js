import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Mantém o login da equipe ativo (renova a sessão automaticamente) nas páginas /admin.
export async function middleware(request) {
  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        },
      },
    }
  );
  await supabase.auth.getUser();
  return resposta;
}

export const config = { matcher: ['/admin/:path*'] };
