import { ValueObject } from '@/core/entities/value-object'

export interface CoordinateProps {
  latitude: number
  longitude: number
}

export class Coordinate extends ValueObject<CoordinateProps> {
  get latitude() {
    return this.props.latitude
  }

  get longitude() {
    return this.props.longitude
  }

  distanceTo(other: Coordinate): number {
    const R = 6371 // Earth's radius in kilometers
    const φ1 = (this.latitude * Math.PI) / 180
    const φ2 = (other.latitude * Math.PI) / 180
    const Δφ = ((other.latitude - this.latitude) * Math.PI) / 180
    const Δλ = ((other.longitude - this.longitude) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  static create(props: CoordinateProps) {
    return new Coordinate(props)
  }
}
