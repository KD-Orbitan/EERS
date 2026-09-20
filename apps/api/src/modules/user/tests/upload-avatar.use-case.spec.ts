import { UploadAvatarUseCase } from '../application/use-cases/upload-avatar.use-case'
import { UserImageRepository } from '../domain/repositories/user-image.repository'
import { ImageStorage } from '../../../common/ports/image-storage.port'
import { InvalidFileTypeException, FileTooLargeException } from '../../../common/exceptions/file.exceptions'

describe('UploadAvatarUseCase', () => {
  let useCase: UploadAvatarUseCase
  let userImageRepository: jest.Mocked<UserImageRepository>
  let imageStorage: jest.Mocked<Pick<ImageStorage, 'uploadImage' | 'deleteImage'>>

  const validFile = {
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('fake-image-data'),
  } as Express.Multer.File

  beforeEach(() => {
    userImageRepository = {
      findAvatarByUserId: jest.fn(),
      createAvatar: jest.fn(),
      deleteById: jest.fn(),
    }

    imageStorage = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    }

    useCase = new UploadAvatarUseCase(userImageRepository, imageStorage as unknown as ImageStorage)
  })

  it('saves image record with imageType AVATAR', async () => {
    userImageRepository.findAvatarByUserId.mockResolvedValue(null)
    imageStorage.uploadImage.mockResolvedValue({
      publicId: 'eers/avatar-1',
      secureUrl: 'https://cdn.example.com/avatar-1.png',
      width: 200,
      height: 200,
      format: 'png',
    } as any)
    userImageRepository.createAvatar.mockResolvedValue({
      imageId: 10,
      cloudinaryPublicId: 'eers/avatar-1',
      secureUrl: 'https://cdn.example.com/avatar-1.png',
    })

    const result = await useCase.execute({ userId: 1, file: validFile })

    expect(userImageRepository.createAvatar).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, cloudinaryPublicId: 'eers/avatar-1', secureUrl: 'https://cdn.example.com/avatar-1.png' }),
    )
    expect(result).toEqual({ avatarUrl: 'https://cdn.example.com/avatar-1.png' })
  })

  it('replaces existing avatar by deleting old image from Cloudinary and DB before uploading the new one', async () => {
    userImageRepository.findAvatarByUserId.mockResolvedValue({
      imageId: 5,
      cloudinaryPublicId: 'eers/old-avatar',
      secureUrl: 'https://cdn.example.com/old-avatar.png',
    })
    imageStorage.uploadImage.mockResolvedValue({
      publicId: 'eers/new-avatar',
      secureUrl: 'https://cdn.example.com/new-avatar.png',
      width: 100,
      height: 100,
      format: 'jpg',
    } as any)
    userImageRepository.createAvatar.mockResolvedValue({
      imageId: 11,
      cloudinaryPublicId: 'eers/new-avatar',
      secureUrl: 'https://cdn.example.com/new-avatar.png',
    })

    await useCase.execute({ userId: 1, file: validFile })

    expect(imageStorage.deleteImage).toHaveBeenCalledWith('eers/old-avatar')
    expect(userImageRepository.deleteById).toHaveBeenCalledWith(5)
    expect(imageStorage.deleteImage.mock.invocationCallOrder[0]).toBeLessThan(
      imageStorage.uploadImage.mock.invocationCallOrder[0],
    )
  })

  it('throws InvalidFileTypeException for a disallowed mimetype', async () => {
    const badFile = { ...validFile, mimetype: 'application/pdf' } as Express.Multer.File

    await expect(useCase.execute({ userId: 1, file: badFile })).rejects.toBeInstanceOf(InvalidFileTypeException)
    expect(userImageRepository.findAvatarByUserId).not.toHaveBeenCalled()
    expect(imageStorage.uploadImage).not.toHaveBeenCalled()
  })

  it('throws FileTooLargeException when file exceeds 10MB', async () => {
    const bigFile = { ...validFile, size: 11 * 1024 * 1024 } as Express.Multer.File

    await expect(useCase.execute({ userId: 1, file: bigFile })).rejects.toBeInstanceOf(FileTooLargeException)
    expect(imageStorage.uploadImage).not.toHaveBeenCalled()
  })
})
