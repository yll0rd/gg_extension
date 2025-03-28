import { PartialType } from '@nestjs/swagger';
import { CreateLoggingDto } from './create-logging.dto';

export class UpdateLoggingDto extends PartialType(CreateLoggingDto) {}
