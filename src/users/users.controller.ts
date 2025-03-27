import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account with the provided details',
  })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email or username already exists',
  })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      basic: {
        summary: 'Basic user',
        value: {
          username: 'johndoe',
          email: 'john@doe.com',
          password: '00000000',
        },
      },
      full: {
        summary: 'Full user details',
        value: {
          username: 'janedoe',
          email: 'jane@doe.com',
          password: '00000000',
          displayName: 'Jane Doe',
          avatar: 'https://doe.com/jane.jpg',
          bio: 'I am the daughter of Doe',
        },
      },
    },
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves user details for the specified user ID',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID format)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates user details for the specified user ID',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID format)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      password: {
        summary: 'Update password',
        value: {
          password: '12345678',
        },
      },
      profile: {
        summary: 'Update profile',
        value: {
          displayName: 'John Doe',
          avatar: 'https://doe.com/john.jpg',
          bio: 'I am the son of Doe',
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Deletes the user with the specified ID',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID format)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'User deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
