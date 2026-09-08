
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ygnnohdosvuvbeeziwon.supabase.co';
const supabaseAnonKey = 'sb_publishable_ztrXoUAVmRo_oamBo6Gt9A_BdWVgXaN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
