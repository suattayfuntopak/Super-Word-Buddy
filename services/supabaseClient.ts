
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yayrzhqzxdicsricskce.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJ6aHF6eGRpY3NyaWNza2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTE5OTEsImV4cCI6MjA4MzQ2Nzk5MX0.1uHv6_rYTxqMdn8af7mLcAhHW_0qO8c8M06PaoxaB2k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
