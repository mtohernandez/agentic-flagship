import { createProxyHandler } from '@/shared/api/route-helpers';

export const POST = createProxyHandler({ upstream: '/run-mission', method: 'POST', stream: true });
