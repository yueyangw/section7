export const POST_TYPES = ['NET', 'AI', 'SYS', 'DEV', 'OI', 'ESSAY', 'LIFE'] as const;
export type PostType = (typeof POST_TYPES)[number];
