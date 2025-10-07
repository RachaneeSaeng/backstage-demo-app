import { LoggerService } from '@backstage/backend-plugin-api';
import { Octokit } from '@octokit/core';
import { graphql } from '@octokit/graphql';
import { throttling } from '@octokit/plugin-throttling';

/**
 * Factory for creating Octokit clients with standardized throttling configuration
 */
export class OctokitFactory {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Handle rate limit with retry logic
   */
  private handleRateLimit(
    limitType: string,
    clientType: 'REST' | 'GraphQL',
    retryAfter: number,
    options: any,
    retryCount: number,
  ): boolean {
    this.logger.warn(
      `${clientType} ${limitType} for request ${options.method} ${options.url}`,
    );
    if (retryCount < 2) {
      this.logger.info(`Retrying after ${retryAfter} seconds for the ${retryCount} time`);
      return true;
    }
    return false;
  }

  /**
   * Create throttling options for Octokit
   */
  private createThrottleOptions(clientType: 'REST' | 'GraphQL') {
    return {
      onRateLimit: (retryAfter: number, options: any, _octo: any, retryCount: number) => {
        return this.handleRateLimit('request quota exhausted', clientType, retryAfter, options, retryCount);
      },
      onSecondaryRateLimit: (retryAfter: number, options: any, _octo: any, retryCount: number) => {
        return this.handleRateLimit('secondary rate limit hit', clientType, retryAfter, options, retryCount);
      },
    };
  }

  /**
   * Create Octokit REST client with throttling
   */
  createRestClient(token: string, baseUrl: string): Octokit {
    const ThrottledOctokit = Octokit.plugin(throttling);
    return new ThrottledOctokit({
      auth: token,
      baseUrl,
      throttle: this.createThrottleOptions('REST'),
    });
  }

  /**
   * Create GraphQL client with throttling
   */
  createGraphQLClient(
    headers: { [name: string]: string } | undefined,
    baseUrl: string,
  ): typeof graphql {
    const ThrottledOctokit = Octokit.plugin(throttling);
    const octokit = new ThrottledOctokit({
      throttle: this.createThrottleOptions('GraphQL'),
    });

    return octokit.graphql.defaults({
      headers,
      baseUrl,
    });
  }
}
