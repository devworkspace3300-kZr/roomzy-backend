import { Controller, Post, Get, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SenderRole } from '../common/enums/sender-role.enum';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('direct')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a direct message' })
  async sendDirectMessage(
    @CurrentUser() user: any,
    @Body() body: { conversationId?: string; recipientId?: string; hostelId?: string; content: string }
  ) {
    const senderRole = user.role as SenderRole;
    return this.chatService.sendDirectMessage({
      conversationId: body.conversationId,
      senderId: user.sub,
      recipientId: body.recipientId,
      hostelId: body.hostelId,
      content: body.content,
      senderRole: senderRole
    });
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  async getConversations(@CurrentUser() user: any) {
    return this.chatService.getConversations(user.sub);
  }

  @Get('admin/inquiries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all platform support inquiries for admin' })
  async getAdminInquiries(@CurrentUser() user: any) {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }
    return this.chatService.getAdminInquiries();
  }

  @Get('messages/:conversationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages for a specific conversation' })
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Delete('admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all conversations and messages (Admin only)' })
  async deleteAllChats(@CurrentUser() user: any) {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new Error('Unauthorized');
    }
    return this.chatService.deleteAllChats();
  }
}
