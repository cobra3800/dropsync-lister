import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EbayAccountRepository } from './repositories/ebay-account.repository.js';

type EbayTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type: string;
  scope?: string;
};

@Injectable()
export class EbayService {
  constructor(
    private readonly ebayRepository: EbayAccountRepository,
  ) {}

  private getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
      throw new InternalServerErrorException(
        `Missing environment variable: ${name}`,
      );
    }

    return value;
  }

  getConnectUrl(storeId: string): string {
    const clientId = this.getRequiredEnv('EBAY_CLIENT_ID');
    const ruName = this.getRequiredEnv('EBAY_RUNAME');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: ruName,
      response_type: 'code',
      state: storeId,
      scope: [
        'https://api.ebay.com/oauth/api_scope',
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.account',
      ].join(' '),
    });

    return `https://auth.sandbox.ebay.com/oauth2/authorize?${params.toString()}`;
  }

  async exchangeAuthorizationCode(
    code: string,
    storeId: string,
  ): Promise<EbayTokenResponse> {
    const clientId = this.getRequiredEnv('EBAY_CLIENT_ID');
    const clientSecret = this.getRequiredEnv('EBAY_CLIENT_SECRET');
    const ruName = this.getRequiredEnv('EBAY_RUNAME');

    const basicAuth = Buffer.from(
      `${clientId}:${clientSecret}`,
      'utf8',
    ).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: ruName,
    });

    const response = await fetch(
      'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
    );

    const result = (await response.json()) as
      | EbayTokenResponse
      | {
          error?: string;
          error_description?: string;
        };

    if (!response.ok) {
      throw new BadRequestException({
        message: 'eBay token exchange failed',
        ebayError: result,
      });
    }

    const tokens = result as EbayTokenResponse;

    if (!tokens.refresh_token) {
      throw new BadRequestException(
        'eBay did not return a refresh token',
      );
    }

    await this.ebayRepository.save({
      storeId,
      ebayUserId: undefined,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(
        Date.now() + tokens.expires_in * 1000,
      ),
      environment: process.env.EBAY_ENV ?? 'sandbox',
      scope: tokens.scope ?? '',
    });

    return tokens;
  }

  async refreshAccessToken(storeId: string): Promise<string> {
    const account = await this.ebayRepository.findByStore(storeId);

    if (!account?.refreshToken) {
      throw new BadRequestException(
        'No eBay refresh token exists. Reconnect the store.',
      );
    }

    const clientId = this.getRequiredEnv('EBAY_CLIENT_ID');
    const clientSecret = this.getRequiredEnv('EBAY_CLIENT_SECRET');

    const basicAuth = Buffer.from(
      `${clientId}:${clientSecret}`,
      'utf8',
    ).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: account.refreshToken,
    });

    if (account.scope) {
      body.set('scope', account.scope);
    }

    const response = await fetch(
      'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
    );

    const result = (await response.json()) as
      | EbayTokenResponse
      | {
          error?: string;
          error_description?: string;
        };

    if (
      !response.ok ||
      !('access_token' in result) ||
      !result.access_token
    ) {
      throw new BadRequestException({
        message: 'Unable to refresh eBay access token',
        ebayError: result,
      });
    }

    const tokens = result as EbayTokenResponse;

        await this.ebayRepository.save({
      storeId,
      ebayUserId: account.ebayUserId ?? undefined,
      accessToken: tokens.access_token,
      refreshToken: account.refreshToken,
      expiresAt: new Date(
        Date.now() + tokens.expires_in * 1000,
      ),
      environment: account.environment,
      scope: tokens.scope ?? account.scope ?? '',
    });

    return tokens.access_token;
  } // closes refreshAccessToken()

  async getOptedInPrograms(storeId: string) {
    const account = await this.ebayRepository.findByStore(storeId);

    if (!account) {
      throw new BadRequestException(
        'No eBay account found for this store.',
      );
    }

    let accessToken = account.accessToken;

    if (!account.expiresAt || account.expiresAt <= new Date()) {
      accessToken = await this.refreshAccessToken(storeId);
    }

    const response = await fetch(
      'https://api.sandbox.ebay.com/sell/account/v1/program/get_opted_in_programs',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new BadRequestException({
        message: 'Unable to check eBay programs',
        ebayError: result,
      });
    }

    return result;
  } // closes getOptedInPrograms()
} // closes EbayService