import { validateSync } from 'class-validator'
import { UpdateScoringConfigDto } from '../application/dto/update-scoring-config.dto'

describe('Scoring configuration numeric boundaries', () => {
  it.each([
    ['bayesianC', -0.1], ['bayesianC', 1.1], ['bayesianM', 0], ['bayesianM', 1.5],
    ['thetaSpam', 0], ['spamWindowHours', 0], ['weightAlpha', -0.1],
    ['suspiciousDelta', 1.1], ['timeDecayLambda', -1], ['trustGamma', Number.NaN],
  ])('rejects %s=%s before it can affect the scoring pipeline', (field, value) => {
    const dto = Object.assign(new UpdateScoringConfigDto(), { [field]: value })
    expect(validateSync(dto).some((error) => error.property === field)).toBe(true)
  })

  it('accepts the seeded numeric configuration', () => {
    const dto = Object.assign(new UpdateScoringConfigDto(), {
      bayesianC: 0.63, bayesianM: 10,
      fraudLambda1: 0.4, fraudLambda2: 0.4, fraudLambda3: 0.2,
      thetaDup: 0.85, lDup: 20, thetaSpam: 5, spamWindowHours: 24,
      thetaSus: 0.3, thetaReject: 0.7,
      trustAlpha: 0.5, trustBeta: 0.3, trustGamma: 0.2,
      suspiciousDelta: 0.3, timeDecayLambda: 0.01, sentimentLambda: 0,
      weightAlpha: 0.4, weightBeta: 0.4, weightGamma: 0.2, lMin: 10,
    })
    expect(validateSync(dto)).toEqual([])
  })
})
