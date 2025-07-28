import { getRequestEvent } from '$app/server';

export function getUser() {
	const event = getRequestEvent();

	const name = event.cookies.get('user');
	if (!name) return null;

	return { name };
}
