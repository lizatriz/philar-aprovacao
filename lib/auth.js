import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'philar_admin';

function assinatura() {
  return crypto
    .createHmac('sha256', process.env.ADMIN_PASSWORD || '')
    .update('philar-admin-v1')
    .digest('hex');
}

function iguais(a, b) {
  const x = Buffer.from(a || '');
  const y = Buffer.from(b || '');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export async function estaLogada() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const valor = (await cookies()).get(COOKIE)?.value;
  return iguais(valor, assinatura());
}

export async function exigirAdmin() {
  if (!(await estaLogada())) redirect('/admin/login');
}

export async function fazerLogin(senha) {
  if (!process.env.ADMIN_PASSWORD || !iguais(senha, process.env.ADMIN_PASSWORD)) return false;
  (await cookies()).set(COOKIE, assinatura(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function fazerLogout() {
  (await cookies()).delete(COOKIE);
}
