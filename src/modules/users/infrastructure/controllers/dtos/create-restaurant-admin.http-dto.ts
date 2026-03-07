import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  MinLength,
} from 'class-validator';
import { RestaurantCategory } from '@modules/restaurants/domain/enums/restaurant-category.enum';
import {
  PHONE_SPAIN_MESSAGE,
  PHONE_SPAIN_PATTERN,
} from '@shared/domain/constants/validation.constants';

export class CreateRestaurantAdminHttpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_SPAIN_PATTERN, { message: PHONE_SPAIN_MESSAGE })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  restaurantName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_SPAIN_PATTERN, { message: PHONE_SPAIN_MESSAGE })
  restaurantPhone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  restaurantAddress: string;

  @IsEnum(RestaurantCategory)
  restaurantCategory: RestaurantCategory;

  @IsEmail()
  @IsNotEmpty()
  restaurantEmail: string;

  @IsUrl()
  @IsNotEmpty()
  restaurantImageUrl: string;
}
