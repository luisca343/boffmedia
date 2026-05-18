import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { FicusAIFacadeService } from './ficusai.facade.service';
import { MessageService } from './services/messages.service';
import { AIService } from './services/ai-service';
import { PokemonDataService } from './services/pokemon-data.service';
import { MessageSender } from './enums/message-sender.enum';
import { MessagePartType } from './dto/message-part.dto';

const mockMessageService = {
  getMessages: jest.fn(),
  createWelcomeMessage: jest.fn(),
  deleteUserMessages: jest.fn(),
  storeMessage: jest.fn(),
  getMessagesForContext: jest.fn(),
  getUserMessageCount: jest.fn(),
};

const mockAiService = {
  generateResponse: jest.fn(),
  generateFallbackResponse: jest.fn(),
  deduplicateFunctionCalls: jest.fn(),
};

const mockPokemonDataService = {
  getPokemonCount: jest.fn(),
  getRandomPokemon: jest.fn(),
  getPokemonDataParts: jest.fn(),
  getSimilarPokemonNames: jest.fn(),
  pokemonExists: jest.fn(),
};

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const botMessage = {
  sender: MessageSender.BOT,
  parts: [{ type: MessagePartType.TEXT, content: 'Hola!' }],
};

const userMessage = {
  sender: MessageSender.USER,
  parts: [{ type: MessagePartType.TEXT, content: 'Hola FicusAI' }],
};

describe('FicusAIFacadeService', () => {
  let service: FicusAIFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAiService.deduplicateFunctionCalls.mockImplementation((calls) => calls);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FicusAIFacadeService,
        { provide: Logger, useValue: mockLogger },
        { provide: MessageService, useValue: mockMessageService },
        { provide: AIService, useValue: mockAiService },
        { provide: PokemonDataService, useValue: mockPokemonDataService },
      ],
    }).compile();

    service = module.get<FicusAIFacadeService>(FicusAIFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getMessages ──────────────────────────────────────────────────────────────

  describe('getMessages()', () => {
    it('delegates to MessageService with uuid and limit', async () => {
      mockMessageService.getMessages.mockResolvedValue([botMessage]);

      const result = await service.getMessages({ uuid: 'test-uuid', limit: 10 } as any);

      expect(mockMessageService.getMessages).toHaveBeenCalledWith('test-uuid', 10);
      expect(result).toEqual([botMessage]);
    });
  });

  // ─── initializeChat ───────────────────────────────────────────────────────────

  describe('initializeChat()', () => {
    it('returns welcome message from MessageService', async () => {
      mockMessageService.createWelcomeMessage.mockResolvedValue(botMessage);

      const result = await service.initializeChat('test-uuid');

      expect(mockMessageService.createWelcomeMessage).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(botMessage);
    });
  });

  // ─── deleteUserMessages ───────────────────────────────────────────────────────

  describe('deleteUserMessages()', () => {
    it('returns { success: true } when service returns true', async () => {
      mockMessageService.deleteUserMessages.mockResolvedValue(true);

      const result = await service.deleteUserMessages('test-uuid');

      expect(result).toEqual({ success: true });
    });

    it('returns { success: false } when service returns false', async () => {
      mockMessageService.deleteUserMessages.mockResolvedValue(false);

      const result = await service.deleteUserMessages('test-uuid');

      expect(result).toEqual({ success: false });
    });
  });

  // ─── getUserMessageCount ──────────────────────────────────────────────────────

  describe('getUserMessageCount()', () => {
    it('delegates to MessageService', async () => {
      mockMessageService.getUserMessageCount.mockResolvedValue(42);

      const result = await service.getUserMessageCount('test-uuid');

      expect(mockMessageService.getUserMessageCount).toHaveBeenCalledWith('test-uuid');
      expect(result).toBe(42);
    });
  });

  // ─── sendMessage ──────────────────────────────────────────────────────────────

  describe('sendMessage()', () => {
    it('stores user message, gets AI response with no function calls, returns bot message', async () => {
      mockMessageService.storeMessage.mockResolvedValue(undefined);
      mockMessageService.getMessagesForContext.mockResolvedValue([]);
      mockAiService.generateResponse.mockResolvedValue({ text: 'Hola! Soy FicusAI.', functionCalls: [] });

      const dto = { uuid: 'test-uuid', mensaje: userMessage } as any;
      const result = await service.sendMessage(dto);

      expect(mockMessageService.storeMessage).toHaveBeenCalledWith('test-uuid', userMessage);
      expect(mockAiService.generateResponse).toHaveBeenCalledWith(userMessage, []);
      expect(result.sender).toBe(MessageSender.BOT);
      expect(result.parts[0].content).toBe('Hola! Soy FicusAI.');
    });

    it('does not store message when sender is BOT', async () => {
      const botSentDto = { uuid: 'test-uuid', mensaje: botMessage } as any;
      mockMessageService.getMessagesForContext.mockResolvedValue([]);
      mockAiService.generateResponse.mockResolvedValue({ text: 'OK', functionCalls: [] });
      mockMessageService.storeMessage.mockResolvedValue(undefined);

      await service.sendMessage(botSentDto);

      // storeMessage called once (only for AI response, not for bot-sender input)
      expect(mockMessageService.storeMessage).toHaveBeenCalledTimes(1);
    });

    it('returns error message when AI service throws', async () => {
      mockMessageService.storeMessage.mockResolvedValue(undefined);
      mockMessageService.getMessagesForContext.mockResolvedValue([]);
      mockAiService.generateResponse.mockRejectedValue(new Error('AI unavailable'));

      const dto = { uuid: 'test-uuid', mensaje: userMessage } as any;
      const result = await service.sendMessage(dto);

      expect(result.sender).toBe(MessageSender.BOT);
      expect(result.parts[0].content).toContain('error');
    });

    it('handles function calls — countPokemon', async () => {
      mockMessageService.storeMessage.mockResolvedValue(undefined);
      mockMessageService.getMessagesForContext.mockResolvedValue([]);
      mockAiService.generateResponse.mockResolvedValue({
        text: '',
        functionCalls: [{ name: 'countPokemon', args: {} }],
      });
      mockPokemonDataService.getPokemonCount.mockReturnValue([
        { type: MessagePartType.TEXT, content: 'Hay 1025 Pokémon.' },
      ]);

      const dto = { uuid: 'test-uuid', mensaje: userMessage } as any;
      const result = await service.sendMessage(dto);

      expect(mockPokemonDataService.getPokemonCount).toHaveBeenCalled();
      expect(result.sender).toBe(MessageSender.BOT);
    });
  });
});
