import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { dev } from '$app/environment';
import {
	createAdminSessionToken,
	getAdminCookieName,
	validateAdminLoginSecret
} from '$lib/server/adminSession';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const secret = String(form.get('secret') ?? '');

		if (!validateAdminLoginSecret(secret)) {
			return fail(401, { error: 'Invalid admin secret.' });
		}

		const cookieName = getAdminCookieName();
		cookies.set(cookieName, createAdminSessionToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev
		});

		throw redirect(303, '/admin/games');
	}
};
