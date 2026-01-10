import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null = null;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    // Only create client if both URL and Key are provided
    // This allows the service to start even without Supabase configured
    // The uploadFile method will need to handle the case when Supabase is not available
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('[SupabaseService] Initialized with Supabase client');
    } else {
      console.warn('[SupabaseService] SUPABASE_URL or SUPABASE_KEY not configured. File upload will fail if attempted.');
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error(
        'SUPABASE_URL và SUPABASE_KEY phải được cấu hình trong file .env để upload file',
      );
    }
    return this.supabase;
  }
}
