export const AccountRole = {
  ADMIN: 'ADMIN',
  WORKER: 'WORKER',
} as const

export type AccountRole = (typeof AccountRole)[keyof typeof AccountRole]
