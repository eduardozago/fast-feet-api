import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ReadModel } from '@/core/read-model'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'

export interface DeliveryDetailsProps {
  deliveryId: UniqueEntityID
  recipientId: UniqueEntityID
  courierId?: UniqueEntityID | null
  recipientName: string
  courierName?: string | null
  status: DeliveryStatus
  createdAt: Date
  updatedAt?: Date | null
}

export class DeliveryDetails extends ReadModel<DeliveryDetailsProps> {
  get deliveryId() {
    return this.props.deliveryId
  }

  get recipientId() {
    return this.props.recipientId
  }

  get courierId() {
    return this.props.courierId
  }

  get recipientName() {
    return this.props.recipientName
  }

  get courierName() {
    return this.props.courierName
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

  static create(props: DeliveryDetailsProps) {
    return new DeliveryDetails(props)
  }
}
