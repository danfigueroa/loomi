export interface PublishOptions {
  persistent?: boolean;
  priority?: number;
  expiration?: string;
  correlationId?: string;
  replyTo?: string;
  headers?: Record<string, string | number | boolean>;
}

export interface MessageHandler {
  (message: MessagePayload, ack: () => void, nack: (requeue?: boolean) => void): Promise<void>;
}

export interface MessagePayload {
  [key: string]: string | number | boolean | Date | null | undefined | string[] | MessagePayload | MessagePayload[];
}

export interface UserEventPayload extends MessagePayload {
  userId: string;
  eventType: 'USER_REGISTERED' | 'USER_UPDATED' | 'USER_LOGIN';
  timestamp: string;
  data: {
    name?: string;
    email?: string;
    isActive?: boolean;
    address?: string;
    profilePicture?: string;
    updatedFields?: string[];
    ipAddress?: string;
    userAgent?: string;
  };
}