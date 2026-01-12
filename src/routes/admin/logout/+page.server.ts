import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAdminCookieName } from '$lib/server/adminSession';

export const load: PageServerLoad = async ({ cookies }) => {
	cookies.delete(getAdminCookieName(), { path: '/' });
	throw redirect(303, '/');
};
