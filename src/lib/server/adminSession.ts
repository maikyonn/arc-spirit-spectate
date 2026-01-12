import crypto from 'node:crypto';
import { env } from '$env/dynamic/private';

const COOKIE_NAME = 'arc_admin';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getAdminSecret(): string {
	const secret = env.ADMIN_SECRET_KEY || env.HOST_SECRET_KEY;
	if (!secret) {
		throw new Error(
			'Missing ADMIN_SECRET_KEY (or HOST_SECRET_KEY fallback) for admin authentication'
		);
	}
	return secret;
}

function base64UrlEncode(input: string): string {
	return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string): string {
	return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(value: string, secret: string): string {
	return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function timingSafeEqual(a: string, b: string): boolean {
	const aBuf = Buffer.from(a);
	const bBuf = Buffer.from(b);
	if (aBuf.length !== bBuf.length) return false;
	return crypto.timingSafeEqual(aBuf, bBuf);
}

export function getAdminCookieName(): string {
	return COOKIE_NAME;
}

export function createAdminSessionToken(params?: { ttlSeconds?: number; nowMs?: number }): string {
	const secret = getAdminSecret();
	const nowMs = params?.nowMs ?? Date.now();
	const ttlSeconds = params?.ttlSeconds ?? DEFAULT_TTL_SECONDS;

	const payload = {
		iat: nowMs,
		exp: nowMs + ttlSeconds * 1000
	};
	const payloadJson = JSON.stringify(payload);
	const payloadB64 = base64UrlEncode(payloadJson);
	const signature = sign(payloadB64, secret);
	return `${payloadB64}.${signature}`;
}

export function isValidAdminSessionToken(token: string | null | undefined): boolean {
	if (!token) return false;
	const secret = getAdminSecret();

	const [payloadB64, signature] = token.split('.');
	if (!payloadB64 || !signature) return false;

	const expected = sign(payloadB64, secret);
	if (!timingSafeEqual(signature, expected)) return false;

	let payload: unknown;
	try {
		payload = JSON.parse(base64UrlDecode(payloadB64));
	} catch {
		return false;
	}

	if (!payload || typeof payload !== 'object') return false;
	const exp = (payload as { exp?: unknown }).exp;
	if (typeof exp !== 'number') return false;
	return Date.now() < exp;
}

export function isAdminRequest(cookies: { get: (name: string) => string | undefined }): boolean {
	return isValidAdminSessionToken(cookies.get(COOKIE_NAME));
}

export function validateAdminLoginSecret(input: string): boolean {
	const secret = getAdminSecret();
	return input === secret;
}
