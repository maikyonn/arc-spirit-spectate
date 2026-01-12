import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

const SCHEMA = 'arc-spirits-game-history';

let cached: SupabaseClient<any, any, any> | null = null;

export function getSupabaseAdmin(): SupabaseClient<any, any, any> | null {
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceRoleKey) return null;
	if (cached) return cached;
	cached = createClient(PUBLIC_SUPABASE_URL, serviceRoleKey, {
		db: { schema: SCHEMA },
		auth: { persistSession: false }
	});
	return cached;
}
