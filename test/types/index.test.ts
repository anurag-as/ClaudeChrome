// Basic test to verify testing infrastructure
import type { ChatConversation, ChatMessage, TextElement } from '../../src/types/index';

describe('Type definitions', () => {
  it('should create a valid ChatConversation object', () => {
    const textElement: TextElement = {
      type: 'text',
      content: 'Hello, world!'
    };

    const message: ChatMessage = {
      role: 'user',
      content: [textElement]
    };

    const conversation: ChatConversation = {
      messages: [message],
      timestamp: new Date()
    };

    expect(conversation.messages).toHaveLength(1);
    expect(conversation.messages[0].role).toBe('user');
    expect(conversation.messages[0].content[0].type).toBe('text');
  });
});
