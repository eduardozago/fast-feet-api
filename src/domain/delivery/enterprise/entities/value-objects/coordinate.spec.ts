import { Coordinate } from './coordinate'

describe('Coordinate', () => {
  it('should return zero when calculating distance to the same coordinate', () => {
    const coordinate = Coordinate.create({
      latitude: -23.55052,
      longitude: -46.633308,
    })

    const distanceInKm = coordinate.distanceTo(coordinate)

    expect(distanceInKm).toBeCloseTo(0, 10)
  })

  it('should calculate distance in kilometers using the haversine formula', () => {
    const saoPaulo = Coordinate.create({
      latitude: -23.55052,
      longitude: -46.633308,
    })

    const rioDeJaneiro = Coordinate.create({
      latitude: -22.906847,
      longitude: -43.172897,
    })

    const distanceInKm = saoPaulo.distanceTo(rioDeJaneiro)

    expect(distanceInKm).toBeCloseTo(360.75, 1)
  })

  it('should return the same distance in both directions', () => {
    const from = Coordinate.create({
      latitude: -15.7801,
      longitude: -47.9292,
    })

    const to = Coordinate.create({
      latitude: -16.6864,
      longitude: -49.2643,
    })

    const fromToDistanceInKm = from.distanceTo(to)
    const toFromDistanceInKm = to.distanceTo(from)

    expect(fromToDistanceInKm).toBeCloseTo(toFromDistanceInKm, 10)
  })
})
