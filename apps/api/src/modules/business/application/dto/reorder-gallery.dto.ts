import { ArrayMinSize, IsArray, IsInt, IsPositive } from 'class-validator'

export class ReorderGalleryDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  imageIds: number[]
}
