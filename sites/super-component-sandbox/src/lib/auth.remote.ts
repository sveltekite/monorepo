import { form, getRequestEvent, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { getUser } from './auth.server';

export const login = form((data) => {
	const event = getRequestEvent();

	const name = data.get('name');

	if (typeof name !== 'string') {
		error(400, 'Name is required');
	}

	event.cookies.set('user', name, { path: '/' });

	redirect(303, '/');
});

export const logout = form(() => {
	const event = getRequestEvent();

	event.cookies.delete('user', { path: '/' });
});

export const me = query(() => {
	return getUser();
});

export const requireUser = query(() => {
	return getUser() ?? redirect(307, '/login');
});
