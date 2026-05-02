import { FetchDeliveriesUseCase } from './fetch-deliveries'
import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'

let deliveriesRepository: InMemoryDeliveriesRepository
let sut: FetchDeliveriesUseCase

describe('Fetch Deliveries', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    sut = new FetchDeliveriesUseCase(deliveriesRepository)
  })

  it('should be able to fetch deliveries', async () => {
    await deliveriesRepository.create(makeDelivery())
    await deliveriesRepository.create(makeDelivery())

    const result = await sut.execute({
      page: 1,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    expect(result.value!.deliveries).toHaveLength(2)
  })

  it('should be able to fetch paginated deliveries', async () => {
    for (let i = 0; i < 12; i++) {
      await deliveriesRepository.create(makeDelivery())
    }

    const result = await sut.execute({
      page: 2,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    expect(result.value!.deliveries).toHaveLength(2)
  })
})
