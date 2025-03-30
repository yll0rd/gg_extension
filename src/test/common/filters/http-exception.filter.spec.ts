import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { ErrorLoggerService } from '../../../src/common/services/error-logger.service';
import { ConfigService } from '@nestjs/config';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let errorLoggerService: ErrorLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        ErrorLoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test'),
          },
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
    errorLoggerService = module.get<ErrorLoggerService>(ErrorLoggerService);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException correctly', () => {
    const mockException = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetRequest = jest.fn().mockReturnValue({
      url: '/test',
    });
    const mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus,
    });
    const mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
      getResponse: mockGetResponse,
    });
    const mockArgumentsHost = {
      switchToHttp: mockHttpArgumentsHost,
    };

    jest.spyOn(errorLoggerService, 'logError').mockImplementation();

    filter.catch(mockException, mockArgumentsHost as any);

    expect(errorLoggerService.logError).toHaveBeenCalledWith(mockException, '/test');
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        timestamp: expect.any(String),
        path: '/test',
      }),
    );
  });

  it('should handle unknown errors correctly', () => {
    const mockException = new Error('Unknown error');
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetRequest = jest.fn().mockReturnValue({
      url: '/test',
    });
    const mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus,
    });
    const mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
      getResponse: mockGetResponse,
    });
    const mockArgumentsHost = {
      switchToHttp: mockHttpArgumentsHost,
    };

    jest.spyOn(errorLoggerService, 'logError').mockImplementation();

    filter.catch(mockException, mockArgumentsHost as any);

    expect(errorLoggerService.logError).toHaveBeenCalledWith(mockException, '/test');
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: expect.any(String),
        path: '/test',
      }),
    );
  });
});