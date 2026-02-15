
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = '';
// const supabaseAnonKey = '';

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
