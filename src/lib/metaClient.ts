// src/lib/metaClient.ts
// Meta WhatsApp Cloud API client
// Version: 1.0 (Production-Ready)
// Purpose: Handle all communication with Meta Graph API

import axios, { AxiosInstance, AxiosError } from 'axios';
import crypto from 'crypto';

/**
 * Meta API error response type
 */
export interface MetaErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details: string;
    };
  };
}

/**
 * Meta send message response type
 */
export interface MetaSendMessageResponse {
  messages: Array<{
    id: string; // wamid.xxx
    message_status: string;
  }>;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
}

/**
 * Message payload for sending via Meta API
 */
export interface MessagePayload {
  messaging_product: string;
  recipient_type: string;
  to: string; // Phone number in E.164 format
  type: string; // "text" or "template"
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: string;
      parameters?: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

/**
 * Error classification for BullMQ retry logic
 */
export interface ClassifiedError {
  type: 'PERMANENT' | 'TRANSIENT' | 'AUTH_FAILED' | 'RATE_LIMITED' | 'UNKNOWN';
  statusCode: number;
  metaErrorCode?: number;
  message: string;
  shouldRetry: boolean;
}

/**
 * Meta WhatsApp API client
 * Handles all communication with Meta's Graph API v21.0
 */
export class MetaClient {
  private client: AxiosInstance;
  private apiVersion: string = 'v21.0';
  private apiBaseUrl: string = 'https://graph.facebook.com';
  private phoneNumberId: string;
  private accessToken: string;
  private appSecret: string;
  private wabaId: string;

  constructor(phoneNumberId: string, accessToken: string, appSecret: string, wabaId: string = '') {
    this.phoneNumberId = phoneNumberId;
    this.accessToken = accessToken;
    this.appSecret = appSecret;
    this.wabaId = wabaId;

    // Create axios instance with auth
    this.client = axios.create({
      baseURL: `${this.apiBaseUrl}/${this.apiVersion}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.handleAxiosError(error))
    );
  }

  /**
   * Send a text message via Meta API
   *
   * @param phoneNumber Recipient phone in E.164 format
   * @param messageBody Text message body
   * @returns Promise<MetaSendMessageResponse | AxiosError>
   */
  async sendTextMessage(
    phoneNumber: string,
    messageBody: string
  ): Promise<{
    status: number;
    data?: MetaSendMessageResponse;
    error?: MetaErrorResponse;
  }> {
    try {
      const payload: MessagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'text',
        text: {
          body: messageBody,
        },
      };

      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      return {
        status: response.status,
        data: response.data,
      };
    } catch (err) {
      return this.handleSendError(err);
    }
  }

  /**
   * Send a template message via Meta API
   *
   * @param phoneNumber Recipient phone in E.164 format
   * @param templateName Name of approved template
   * @param languageCode Language code (e.g., "en")
   * @param variables Array of template variables ["John", "Black"]
   * @returns Promise with response or error
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    languageCode: string,
    variables: string[]
  ): Promise<{
    status: number;
    data?: MetaSendMessageResponse;
    error?: MetaErrorResponse;
  }> {
    try {
      // Convert variables to Meta API format
      const components = [
        {
          type: 'body',
          parameters: variables.map((variable) => ({
            type: 'text',
            text: variable,
          })),
        },
      ];

      const payload: MessagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components,
        },
      };

      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      return {
        status: response.status,
        data: response.data,
      };
    } catch (err) {
      return this.handleSendError(err);
    }
  }

  /**
   * Fetch the phone number's tier (messaging limit)
   *
   * @returns Promise<{tier: string, status: string}> or error
   */
  async fetchTier(): Promise<{
    tier?: string;
    status?: string;
    error?: string;
  }> {
    try {
      const response = await this.client.get(`/${this.phoneNumberId}`, {
        params: {
          fields: 'messaging_limit_tier,status',
        },
      });

      return {
        tier: response.data.messaging_limit_tier,
        status: response.data.status,
      };
    } catch (err) {
      if (err instanceof AxiosError) {
        return {
          error: `Failed to fetch tier: ${err.message}`,
        };
      }
      return {
        error: 'Unknown error fetching tier',
      };
    }
  }

  /**
   * Fetch approved templates from Meta
   *
   * @returns Promise<Array> of approved templates
   */
  async fetchTemplates(): Promise<
    Array<{
      name: string;
      status: string;
      language: string;
      components: any[];
    }> | null
  > {
    try {
      // Use WABA ID if provided, fall back to /me for dev convenience
      const basePath = this.wabaId ? `/${this.wabaId}` : '/me';
      const response = await this.client.get(`${basePath}/message_templates`, {
        params: {
          fields: 'name,status,language,components',
          limit: 100,
        },
      });

      return response.data.data || [];
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      return null;
    }
  }

  /**
   * Classify error for retry logic
   *
   * Categorizes errors into:
   * - PERMANENT: Don't retry (invalid number, etc.)
   * - TRANSIENT: Retry automatically (rate limit, server error)
   * - AUTH_FAILED: Account/auth issue (freeze campaign)
   * - RATE_LIMITED: Rate limit hit (retry with backoff)
   * - UNKNOWN: Unknown error
   *
   * @param error AxiosError from API call
   * @returns ClassifiedError with retry guidance
   */
  classifyError(error: AxiosError): ClassifiedError {
    const statusCode = error.response?.status || 0;
    const errorData = error.response?.data as any;
    const metaErrorCode = errorData?.error?.code;

    // HTTP 400: Bad request (permanent)
    if (statusCode === 400) {
      return {
        type: 'PERMANENT',
        statusCode,
        metaErrorCode,
        message: `Invalid request: ${errorData?.error?.message || 'Bad request'}`,
        shouldRetry: false,
      };
    }

    // HTTP 401/403: Authentication/authorization (account restricted)
    if (statusCode === 401 || statusCode === 403) {
      return {
        type: 'AUTH_FAILED',
        statusCode,
        metaErrorCode,
        message: `Authentication failed: ${errorData?.error?.message || 'Unauthorized'}`,
        shouldRetry: false,
      };
    }

    // HTTP 429: Rate limited (transient, retry with backoff)
    if (statusCode === 429) {
      return {
        type: 'RATE_LIMITED',
        statusCode,
        metaErrorCode,
        message: 'Rate limit hit, will retry with backoff',
        shouldRetry: true,
      };
    }

    // HTTP 5xx: Server error (transient)
    if (statusCode >= 500 && statusCode < 600) {
      return {
        type: 'TRANSIENT',
        statusCode,
        metaErrorCode,
        message: `Meta server error ${statusCode}, will retry`,
        shouldRetry: true,
      };
    }

    // Timeout or network error (transient)
    if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
      return {
        type: 'TRANSIENT',
        statusCode,
        message: 'Network error, will retry',
        shouldRetry: true,
      };
    }

    // Unknown error
    return {
      type: 'UNKNOWN',
      statusCode,
      metaErrorCode,
      message: error.message,
      shouldRetry: false,
    };
  }

  /**
   * Verify webhook signature from Meta
   *
   * Used to ensure webhooks are actually from Meta
   *
   * @param body Raw request body
   * @param signature X-Hub-Signature-256 header value
   * @returns true if signature is valid
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', this.appSecret)
        .update(body)
        .digest('hex');

      const expectedSignature = `sha256=${hash}`;
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return false;
    }
  }

  /**
   * Private: Handle axios errors
   */
  private handleAxiosError(error: AxiosError): AxiosError {
    const metaError = error.response?.data as any;

    if (metaError?.error?.code) {
      console.error(
        `Meta API Error [${metaError.error.code}]: ${metaError.error.message}`
      );
    }

    return error;
  }

  /**
   * Private: Handle send message errors
   */
  private handleSendError(err: any) {
    if (err instanceof AxiosError) {
      const statusCode = err.response?.status || 0;
      const errorData = err.response?.data as any;

      return {
        status: statusCode,
        error: errorData,
      };
    }

    return {
      status: 500,
      error: {
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          code: 0,
        },
      },
    };
  }
}

/**
 * Singleton instance factory
 * Usage: const metaClient = createMetaClient(phoneId, token, secret);
 */
export function createMetaClient(
  phoneNumberId: string,
  accessToken: string,
  appSecret: string,
  wabaId: string = ''
): MetaClient {
  return new MetaClient(phoneNumberId, accessToken, appSecret, wabaId);
}

/**
 * Example usage:
 *
 * const meta = createMetaClient(
 *   process.env.PHONE_NUMBER_ID,
 *   process.env.META_ACCESS_TOKEN,
 *   process.env.META_APP_SECRET
 * );
 *
 * // Send text message
 * const result = await meta.sendTextMessage(
 *   '+919876543210',
 *   'Hello, your cartridge is ready!'
 * );
 *
 * // Send template message
 * const result = await meta.sendTemplateMessage(
 *   '+919876543210',
 *   'cartridge_restock',
 *   'en',
 *   ['John', 'Black']
 * );
 *
 * // Classify error for retry logic
 * const classified = meta.classifyError(error);
 * if (classified.shouldRetry) {
 *   // Retry with BullMQ backoff
 * }
 *
 * // Verify webhook signature
 * if (meta.verifyWebhookSignature(body, signature)) {
 *   // Process webhook
 * }
 */
