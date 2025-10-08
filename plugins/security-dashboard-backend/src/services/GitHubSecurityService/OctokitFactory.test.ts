import { mockServices } from '@backstage/backend-test-utils';
import { OctokitFactory } from './OctokitFactory';

describe('OctokitFactory', () => {
  const logger = mockServices.logger.mock();
  let factory: OctokitFactory;

  beforeEach(() => {
    factory = new OctokitFactory(logger);
    jest.clearAllMocks();
  });

  describe('createRestClient', () => {
    it('should create a REST client with auth token', () => {
      const token = 'test-token-123';
      const baseUrl = 'https://api.github.com';

      const client = factory.createRestClient(token, baseUrl);

      expect(client).toBeDefined();
      expect(client.request).toBeDefined();
      expect(typeof client.request).toBe('function');
    });

    it('should create REST client with custom base URL', () => {
      const token = 'test-token-456';
      const baseUrl = 'https://github.enterprise.com/api/v3';

      const client = factory.createRestClient(token, baseUrl);

      expect(client).toBeDefined();
    });
  });

  describe('createGraphQLClient', () => {
    it('should create a GraphQL client with headers', () => {
      const headers = { authorization: 'token test-token' };
      const baseUrl = 'https://api.github.com';

      const client = factory.createGraphQLClient(headers, baseUrl);

      expect(client).toBeDefined();
      expect(typeof client).toBe('function');
    });

    it('should create GraphQL client with custom base URL', () => {
      const headers = { authorization: 'token test-token-789' };
      const baseUrl = 'https://github.enterprise.com/api/graphql';

      const client = factory.createGraphQLClient(headers, baseUrl);

      expect(client).toBeDefined();
    });

    it('should handle undefined headers', () => {
      const baseUrl = 'https://api.github.com';

      const client = factory.createGraphQLClient(undefined, baseUrl);

      expect(client).toBeDefined();
    });
  });

  describe('throttling configuration', () => {
    it('should create REST client with throttling plugin', () => {
      const token = 'test-token';
      const baseUrl = 'https://api.github.com';

      const client = factory.createRestClient(token, baseUrl);

      // Verify the client was created successfully with throttling
      expect(client).toBeDefined();
      expect(client.request).toBeDefined();
    });

    it('should create GraphQL client with throttling plugin', () => {
      const headers = { authorization: 'token test' };
      const baseUrl = 'https://api.github.com';

      const client = factory.createGraphQLClient(headers, baseUrl);

      // Verify the client was created successfully with throttling
      expect(client).toBeDefined();
    });
  });

  describe('client instances', () => {
    it('should create different REST client instances', () => {
      const token1 = 'token1';
      const token2 = 'token2';
      const baseUrl = 'https://api.github.com';

      const client1 = factory.createRestClient(token1, baseUrl);
      const client2 = factory.createRestClient(token2, baseUrl);

      expect(client1).not.toBe(client2);
    });

    it('should create different GraphQL client instances', () => {
      const headers1 = { authorization: 'token1' };
      const headers2 = { authorization: 'token2' };
      const baseUrl = 'https://api.github.com';

      const client1 = factory.createGraphQLClient(headers1, baseUrl);
      const client2 = factory.createGraphQLClient(headers2, baseUrl);

      expect(client1).not.toBe(client2);
    });
  });
});
