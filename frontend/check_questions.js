import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yircihonewpkqvnbjnfc.supabase.co';
const supabaseKey = 'sb_publishable_X6HF8nF3But9yzD0rXOkYw_UrWDCp8X';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestions() {
  const { data, error } = await supabase.from('perguntas').select('tema');
  if (error) console.error(error);
}
checkQuestions();
