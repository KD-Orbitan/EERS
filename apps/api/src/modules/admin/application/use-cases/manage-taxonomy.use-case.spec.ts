import { ValidationPipe } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ManageTaxonomyUseCase } from './manage-taxonomy.use-case'
import { CreateCategoryDto } from '../dto/create-category.dto'
import { CreateCriterionDto } from '../dto/create-criterion.dto'

describe('ManageTaxonomyUseCase', () => {
  let db: any
  let service: ManageTaxonomyUseCase
  beforeEach(() => {
    const model = () => ({ findUnique: jest.fn().mockResolvedValue({}), count: jest.fn().mockResolvedValue(0), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() })
    db = { category: model(), criterion: model(), businessCategory: model(), categoryCriterion: model(), criterionWeight: model(), reviewCriterion: model() }
    db.$transaction = jest.fn((fn) => fn(db))
    service = new ManageTaxonomyUseCase(db)
  })

  it('edits the existing record, trims names and supports clearing a description', async () => {
    await service.updateCategory(4, '  Retail  ')
    expect(db.category.update).toHaveBeenCalledWith({ where: { categoryId: 4 }, data: { categoryName: 'Retail' } })
    await service.updateCriterion(9, ' Service ', ' ')
    expect(db.criterion.update).toHaveBeenLastCalledWith({ where: { criterionId: 9 }, data: { name: 'Service', description: null } })
    await service.updateCriterion(9, 'Service')
    expect(db.criterion.update).toHaveBeenLastCalledWith({ where: { criterionId: 9 }, data: { name: 'Service' } })
  })

  it.each([['P2002', 409], ['P2025', 404], ['P2003', 409]])('maps database error %s to HTTP %s', async (code, status) => {
    db.category.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Database error', { code, clientVersion: '5' }))
    await expect(service.updateCategory(4, 'Retail')).rejects.toMatchObject({ status })
  })

  it('refuses deletion of categories used by businesses before removing links', async () => {
    db.businessCategory.count.mockResolvedValue(1)
    await expect(service.deleteCategory(4)).rejects.toMatchObject({ code: 'CATEGORY_IN_USE', status: 409 })
    expect(db.criterionWeight.deleteMany).not.toHaveBeenCalled()
    expect(db.categoryCriterion.deleteMany).not.toHaveBeenCalled()
    expect(db.category.delete).not.toHaveBeenCalled()
  })

  it('deletes an unused category and its assignments/weights in one transaction', async () => {
    await expect(service.deleteCategory(4)).resolves.toEqual({ categoryId: 4, deleted: true })
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(db.criterionWeight.deleteMany).toHaveBeenCalledWith({ where: { categoryId: 4 } })
    expect(db.categoryCriterion.deleteMany).toHaveBeenCalledWith({ where: { categoryId: 4 } })
    expect(db.category.delete).toHaveBeenCalledWith({ where: { categoryId: 4 } })
  })

  it.each(['reviewCriterion', 'categoryCriterion'])('protects criteria with %s links', async (model) => {
    db[model].count.mockResolvedValue(1)
    await expect(service.deleteCriterion(9)).rejects.toMatchObject({ code: 'CRITERION_IN_USE', status: 409 })
    expect(db.criterion.delete).not.toHaveBeenCalled()
    expect(db.criterionWeight.deleteMany).not.toHaveBeenCalled()
  })

  it('deletes an unused criterion and obsolete weights', async () => {
    await expect(service.deleteCriterion(9)).resolves.toEqual({ criterionId: 9, deleted: true })
    expect(db.criterionWeight.deleteMany).toHaveBeenCalledWith({ where: { criterionId: 9 } })
    expect(db.criterion.delete).toHaveBeenCalledWith({ where: { criterionId: 9 } })
  })

  it('returns not found without deleting anything for unknown IDs', async () => {
    db.category.findUnique.mockResolvedValue(null)
    db.criterion.findUnique.mockResolvedValue(null)
    await expect(service.deleteCategory(4)).rejects.toMatchObject({ status: 404 })
    await expect(service.deleteCriterion(9)).rejects.toMatchObject({ status: 404 })
    expect(db.category.delete).not.toHaveBeenCalled()
    expect(db.criterion.delete).not.toHaveBeenCalled()
  })

  it('rejects whitespace-only names at the API boundary', async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true })
    await expect(pipe.transform({ categoryName: '  ' }, { type: 'body', metatype: CreateCategoryDto })).rejects.toMatchObject({ status: 400 })
    await expect(pipe.transform({ name: '  ' }, { type: 'body', metatype: CreateCriterionDto })).rejects.toMatchObject({ status: 400 })
    await expect(pipe.transform({ name: 'Service', description: 'x'.repeat(501) }, { type: 'body', metatype: CreateCriterionDto })).rejects.toMatchObject({ status: 400 })
  })
})
