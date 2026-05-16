import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';
import { SenderRole } from '../../common/enums/sender-role.enum';
import { MessageType } from '../../common/enums/message-type.enum';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conv) => conv.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'sender_id' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'enum', enum: SenderRole, name: 'sender_role' })
  senderRole: SenderRole;

  @Column({ type: 'enum', enum: MessageType, name: 'message_type', default: MessageType.TEXT })
  messageType: MessageType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'attachment_url', length: 500, nullable: true })
  attachmentUrl: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
