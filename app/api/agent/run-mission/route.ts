import { createProxyHandler } from '@/shared/api/route-helpers';

export const GET = createProxyHandler({ upstream: '/run-mission', method: 'GET', stream: true });
