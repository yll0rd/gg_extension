import { Controller, Post, Get, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('verify')
  @ApiOperation({ summary: 'Verify wallet ownership' })
  async verifyWallet(@Body() body: { walletAddress: string; signature: string; message: string }) {
    const { walletAddress, signature, message } = body;

    if (!walletAddress || !signature || !message) {
      throw new BadRequestException('Missing required fields');
    }

    const isVerified = await this.walletService.verifyWalletSignature(walletAddress, signature, message);
    return { success: isVerified, message: isVerified ? 'Wallet verified' : 'Invalid signature' };
  }

  @Post('connect')
  @ApiOperation({ summary: 'Connect a wallet to a user' })
  async connectWallet(@Body() body: { userId: string; walletAddress: string }) {
    return this.walletService.connectWallet(body.userId, body.walletAddress);
  }

  @Delete('disconnect/:userId/:walletAddress')
  @ApiOperation({ summary: 'Disconnect a wallet from a user' })
  async disconnectWallet(@Param('userId') userId: string, @Param('walletAddress') walletAddress: string) {
    return this.walletService.disconnectWallet(userId, walletAddress);
  }

  @Get('balance/:walletAddress')
  @ApiOperation({ summary: 'Check wallet balance' })
  async getWalletBalance(@Param('walletAddress') walletAddress: string) {
    return this.walletService.getWalletBalance(walletAddress);
  }

  @Get(':id/activity')
  async getActivity(@Param('id') walletId: string) {
    return this.walletService.getWalletActivity(walletId);
  }
}
