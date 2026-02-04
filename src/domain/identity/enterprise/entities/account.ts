import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Entity } from '@/core/entities/entity'

export const AccountRole = {
  ADMIN: 'ADMIN',
  WORKER: 'WORKER',
} as const

export type AccountRole = (typeof AccountRole)[keyof typeof AccountRole]

export interface AccountProps {
  email: string
  password: string
  role: AccountRole
  createdAt: Date
  updatedAt?: Date | null
}

export class Account extends Entity<AccountProps> {
  get email() {
    return this.props.email
  }

  get password() {
    return this.props.password
  }

  get role() {
    return this.props.role
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  static create(
    props: Optional<AccountProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const account = new Account(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return account
  }
}
