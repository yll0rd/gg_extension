import { Test, TestingModule } from '@nestjs/testing';
import { LogDashboardController } from './ log-dashboard.controller';
import { Controller } from '@nestjs/common';
import { LoggingService } from '../services/logging.service';

describe('LoggingController', () => {
  let controller: LogDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogDashboardController],
      providers: [LoggingService],
    }).compile();

    controller = module.get<LogDashboardController>(LogDashboardController);
  });

  it('should be defined', () => {
    expect(Controller).toBeDefined();
  });
});
