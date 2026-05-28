import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Entity } from '@/core/entities/entity'

export interface RecipientAddressProps {
  recipientId: UniqueEntityID
  street: string
  number: string
  neighborhood: string
  complement?: string | null
  city: string
  state: string
  country: string
  postalCode: string
  latitude: number
  longitude: number
  createdAt: Date
  updatedAt?: Date | null
}

export class RecipientAddress extends Entity<RecipientAddressProps> {
  get recipientId() {
    return this.props.recipientId
  }

  get street() {
    return this.props.street
  }

  get number() {
    return this.props.number
  }

  get neighborhood() {
    return this.props.neighborhood
  }

  get complement(): string | null | undefined {
    return this.props.complement
  }

  get city() {
    return this.props.city
  }

  get state() {
    return this.props.state
  }

  get country() {
    return this.props.country
  }

  get postalCode() {
    return this.props.postalCode
  }

  get latitude() {
    return this.props.latitude
  }

  get longitude() {
    return this.props.longitude
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  set street(street: string) {
    this.props.street = street
  }

  set number(number: string) {
    this.props.number = number
  }

  set neighborhood(neighborhood: string) {
    this.props.neighborhood = neighborhood
  }

  set complement(complement: string | undefined) {
    this.props.complement = complement
  }

  set city(city: string) {
    this.props.city = city
  }

  set state(state: string) {
    this.props.state = state
  }

  set country(country: string) {
    this.props.country = country
  }

  set postalCode(postalCode: string) {
    this.props.postalCode = postalCode
  }

  set latitude(latitude: number) {
    this.props.latitude = latitude
  }

  set longitude(longitude: number) {
    this.props.longitude = longitude
  }

  static create(
    props: Optional<RecipientAddressProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const recipientAddress = new RecipientAddress(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return recipientAddress
  }
}
