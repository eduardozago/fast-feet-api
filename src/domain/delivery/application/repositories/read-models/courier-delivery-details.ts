import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ReadModel } from '@/core/read-model'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'

export interface CourierDeliveryDetailsProps {
  deliveryId: UniqueEntityID
  recipientId: UniqueEntityID
  recipientName: string
  status: DeliveryStatus
  createdAt: Date
  updatedAt?: Date | null
}

export class CourierDeliveryDetails extends ReadModel<CourierDeliveryDetailsProps> {
  get deliveryId() {
    return this.props.deliveryId
  }

  get recipientId() {
    return this.props.recipientId
  }

  get recipientName() {
    return this.props.recipientName
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

  static create(props: CourierDeliveryDetailsProps) {
    return new CourierDeliveryDetails(props)
  }
}
