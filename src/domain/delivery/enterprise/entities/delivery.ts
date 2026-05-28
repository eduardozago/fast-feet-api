import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Entity } from '@/core/entities/entity'

export const DeliveryStatus = {
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
} as const

export type DeliveryStatus =
  (typeof DeliveryStatus)[keyof typeof DeliveryStatus]

export interface DeliveryProps {
  recipientId: UniqueEntityID
  recipientAddressId: UniqueEntityID
  courierId?: UniqueEntityID | null
  status: DeliveryStatus
  createdAt: Date
  updatedAt?: Date | null
}

export class Delivery extends Entity<DeliveryProps> {
  get recipientId() {
    return this.props.recipientId
  }

  get recipientAddressId() {
    return this.props.recipientAddressId
  }

  get courierId() {
    return this.props.courierId
  }

  get status() {
    return this.props.status
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  assignCourier(courierId: UniqueEntityID) {
    this.props.courierId = courierId
    this.props.status = DeliveryStatus.ASSIGNED
    this.touch()
  }

  pickUp() {
    this.props.status = DeliveryStatus.IN_TRANSIT
    this.touch()
  }

  complete() {
    this.props.status = DeliveryStatus.COMPLETED
    this.touch()
  }

  canAssignCourier() {
    return this.props.status === DeliveryStatus.CREATED
  }

  canPickUp() {
    return this.props.status === DeliveryStatus.ASSIGNED
  }

  canComplete() {
    return this.props.status === DeliveryStatus.IN_TRANSIT
  }

  static create(
    props: Optional<DeliveryProps, 'status' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const delivery = new Delivery(
      {
        ...props,
        status: props.status ?? DeliveryStatus.CREATED,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return delivery
  }
}
