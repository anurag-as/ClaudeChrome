
export interface ChatConversation {
  messages: ChatMessage[];
  title?: string;
  timestamp: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: ChatElement[];
  timestamp?: Date;
}

export type ChatElement = 
  | TextElement 
  | CodeBlockElement 
  | TableElement 
  | ImageElement;

export interface TextElement {
  type: 'text';
  content: string;
}

export interface CodeBlockElement {
  type: 'code';
  language: string;
  code: string;
}

export interface TableElement {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ImageElement {
  type: 'image';
  src: string;
  alt?: string;
}

export interface DOMSelectors {
  conversationContainer: string;
  messageContainer: string;
  userMessage: string;
  assistantMessage: string;
  codeBlock: string;
  codeLanguage: string;
  table: string;
  image: string;
}

export enum ErrorType {
  PARSING_ERROR = 'PARSING_ERROR',
  PDF_GENERATION_ERROR = 'PDF_GENERATION_ERROR',
  MARKDOWN_GENERATION_ERROR = 'MARKDOWN_GENERATION_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
