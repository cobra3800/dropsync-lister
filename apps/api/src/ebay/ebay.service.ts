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
      

    return result;
  } // closes getOptedInPrograms()
  return result;
}
  async getBusinessPolicies(storeId: string) {
  const account = await this.ebayRepository.findByStore(storeId);

  if (!account) {
    throw new BadRequestException(
      'No eBay account found for this store.',
    );
  }

  let accessToken = account.accessToken;

  if (!accessToken) {
    throw new BadRequestException(
      'No eBay access token found. Reconnect the store.',
    );
  }

  if (!account.expiresAt || account.expiresAt <= new Date()) {
    accessToken = await this.refreshAccessToken(storeId);
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'Content-Language': 'en-US',
  };

  const baseUrl =
    'https://api.sandbox.ebay.com/sell/account/v1';

  const [paymentResponse, returnResponse, fulfillmentResponse] =
    await Promise.all([
      fetch(
        `${baseUrl}/payment_policy?marketplace_id=EBAY_US`,
        { headers },
      ),
      fetch(
        `${baseUrl}/return_policy?marketplace_id=EBAY_US`,
        { headers },
      ),
      fetch(
        `${baseUrl}/fulfillment_policy?marketplace_id=EBAY_US`,
        { headers },
      ),
    ]);

  const paymentPolicies = await paymentResponse.json();
  const returnPolicies = await returnResponse.json();
  const fulfillmentPolicies =
    await fulfillmentResponse.json();

  if (
  !paymentResponse.ok ||
  !returnResponse.ok ||
  !fulfillmentResponse.ok
) {
  throw new BadRequestException({
    message: 'Unable to retrieve eBay business policies',
    paymentPolicies,
    returnPolicies,
    fulfillmentPolicies,
  });
}

return {
  paymentPolicies,
  returnPolicies,
  fulfillmentPolicies,
};
}

async optInToBusinessPolicies(storeId: string) {
  const account = await this.ebayRepository.findByStore(storeId);

  if (!account?.accessToken) {
    throw new BadRequestException(
      'No connected eBay account found for this store.',
    );
  }

  let accessToken = account.accessToken;

  if (!account.expiresAt || account.expiresAt <= new Date()) {
    accessToken = await this.refreshAccessToken(storeId);
  }

  const response = await fetch(
    'https://api.sandbox.ebay.com/sell/account/v1/program/opt_in',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Content-Language': 'en-US',
      },
      body: JSON.stringify({
        programType: 'SELLING_POLICY_MANAGEMENT',
      }),
    },
  );

  const responseText = await response.text();

  let ebayResult: unknown = null;

  if (responseText) {
    try {
      ebayResult = JSON.parse(responseText);
    } catch {
      ebayResult = responseText;
    }
  }

  if (!response.ok) {
    throw new BadRequestException({
      message: 'Unable to opt in to eBay Business Policies',
      ebayError: ebayResult,
    });
}


  return {
    optedIn: true,
    statusCode: response.status,
    ebayResult,
  };
  }
  async createDefaultPolicies(storeId: string) {
  const account = await this.ebayRepository.findByStore(storeId);

  if (!account?.accessToken) {
    throw new BadRequestException(
      'No connected eBay account found for this store.',
    );
  }

  let accessToken = account.accessToken;

  if (!account.expiresAt || account.expiresAt <= new Date()) {
    accessToken = await this.refreshAccessToken(storeId);
  }

  const response = await fetch(
    'https://api.sandbox.ebay.com/sell/account/v1/payment_policy',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Content-Language': 'en-US',
      },
      body: JSON.stringify({
  name: 'DropSync Payment Policy',
  marketplaceId: 'EBAY_US',
  categoryTypes: [
    {
      name: 'ALL_EXCLUDING_MOTORS_VEHICLES',
      default: true,
    },
  ],
  immediatePay: true,
}),
    },
  );

  const responseText = await response.text();

let result: unknown = null;

if (responseText) {
  try {
    result = JSON.parse(responseText);
  } catch {
    result = responseText;
  }
}
const returnResponse = await fetch(
  'https://api.sandbox.ebay.com/sell/account/v1/return_policy',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Content-Language': 'en-US',
    },
    body: JSON.stringify({
      name: 'DropSync Return Policy',
      marketplaceId: 'EBAY_US',
      categoryTypes: [
        {
          name: 'ALL_EXCLUDING_MOTORS_VEHICLES',
          default: true,
        },
      ],
      returnsAccepted: true,
      returnPeriod: {
        value: 30,
        unit: 'DAY',
      },
      refundMethod: 'MONEY_BACK',
      returnShippingCostPayer: 'BUYER',
    }),
  },
);
const returnResponseText = await returnResponse.text();

let returnResult: unknown = null;

if (returnResponseText) {
  try {
    returnResult = JSON.parse(returnResponseText);
  } catch {
    returnResult = returnResponseText;
  }
}

  return {
  paymentPolicy: {
    status: response.status,
    ok: response.ok,
    location: response.headers.get('location'),
    result,
  },

  returnPolicy: {
    status: returnResponse.status,
    ok: returnResponse.ok,
    location: returnResponse.headers.get('location'),
    result: returnResult,
  },
};
}

async createFulfillmentPolicy(storeId: string) {
  const account = await this.ebayRepository.findByStore(storeId);

  if (!account?.accessToken) {
    throw new BadRequestException(
      'No connected eBay account found for this store.',
    );
  }

  let accessToken = account.accessToken;

  if (!account.expiresAt || account.expiresAt <= new Date()) {
    accessToken = await this.refreshAccessToken(storeId);
  }

 const response = await fetch(
  'https://api.sandbox.ebay.com/sell/account/v1/fulfillment_policy',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Content-Language': 'en-US',
    },
    body: JSON.stringify({
      name: 'DropSync Shipping Policy',
      marketplaceId: 'EBAY_US',

      categoryTypes: [
        {
          name: 'ALL_EXCLUDING_MOTORS_VEHICLES',
          default: true,
        },
      ],

      handlingTime: {
        value: 1,
        unit: 'DAY',
      },

      shippingOptions: [
        {
          optionType: 'DOMESTIC',
          costType: 'FLAT_RATE',
          shippingServices: [
            {
              buyerResponsibleForShipping: false,
              freeShipping: true,
              shippingCarrierCode: 'USPS',
              shippingServiceCode: 'USPSPriorityFlatRateBox',
            },
          ],
        },
      ],
    }),
  },
);

 const responseText = await response.text();
let result: unknown = null;

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = responseText;
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    location: response.headers.get('location'),
    result,
  };
}

} // closes EbayService