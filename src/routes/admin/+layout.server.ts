import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isAdminRequest } from '$lib/server/adminSession';

export const load: LayoutServerLoad = async ({ url, cookies }) => {
	const pathname = url.pathname;

	if (pathname.startsWith('/admin/login')) return {};
	if (pathname.startsWith('/admin/logout')) return {};

	if (!isAdminRequest(cookies)) {
		throw redirect(303, '/admin/login');
	}

	return {};
};
