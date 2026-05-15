import { createClient } from '@supabase/supabase-js'
import SPconfig from './../../configs/SPConfig.js'
const supabase = createClient(
    SPconfig.SUPABASE_URL,
    SPconfig.SUPABASE_KEY
)

export default supabase