import { supabase } from './src/lib/supabase';

async function test() {
  const { data, error } = await supabase
    .from('perguntas')
    .select('id, indice_correto')
    .limit(1);
    
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
