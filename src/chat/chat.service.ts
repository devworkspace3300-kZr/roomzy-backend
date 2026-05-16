import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { SenderRole } from '../common/enums/sender-role.enum';
import { MessageType } from '../common/enums/message-type.enum';
import { ConversationStatus } from '../common/enums/conversation-status.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async sendDirectMessage(data: {
    conversationId?: string;
    senderId: string;
    recipientId?: string; // If null, maybe it's for platform admin?
    hostelId?: string;
    content: string;
    senderRole: SenderRole;
  }) {
    // If no recipientId, we assume it's for the platform admin (contact form)
    // For now, let's just create a message. In a real system, we'd have a system user for admin.
    
    let conversation: Conversation | null = null;
    
    if (data.conversationId) {
      conversation = await this.conversationRepo.findOne({ where: { id: data.conversationId } });
      if (!conversation) throw new NotFoundException('Conversation not found');
    } else {
      // Find or create conversation for new messages
      conversation = await this.conversationRepo.findOne({
        where: {
          studentId: data.senderId,
          ownerId: data.recipientId || IsNull(), // Use IsNull() if no recipient
          hostelId: data.hostelId
        }
      });

      if (!conversation) {
        conversation = this.conversationRepo.create({
          studentId: data.senderId,
          ownerId: data.recipientId || null,
          hostelId: data.hostelId,
          status: ConversationStatus.PRE_BOOKING,
        });
        await this.conversationRepo.save(conversation);
      }
    }

    const message = this.messageRepo.create({
      conversationId: conversation.id,
      senderId: data.senderId,
      senderRole: data.senderRole,
      messageType: MessageType.TEXT,
      content: data.content,
    });

    await this.messageRepo.save(message);

    // Update conversation metadata
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = data.content.substring(0, 300);
    await this.conversationRepo.save(conversation);

    return message;
  }

  async getConversations(userId: string) {
    return this.conversationRepo.find({
      where: [
        { studentId: userId },
        { ownerId: userId }
      ],
      order: { lastMessageAt: 'DESC' },
      relations: ['student', 'owner', 'hostel']
    });
  }

  async getMessages(conversationId: string) {
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      relations: ['sender']
    });
  }

  async getAdminInquiries() {
    return this.conversationRepo.find({
      where: { ownerId: IsNull() },
      order: { lastMessageAt: 'DESC' },
      relations: ['student', 'hostel']
    });
  }

  async deleteAllChats() {
    await this.messageRepo.createQueryBuilder().delete().execute();
    await this.conversationRepo.createQueryBuilder().delete().execute();
    return { message: 'All chats have been securely deleted.' };
  }
}
