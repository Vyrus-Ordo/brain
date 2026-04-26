import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Question {
  id: string;
  texto: string;
  opcoes: string[];
  tema: string;
}

export const useQuestions = (theme: string | null, limit: number = 10) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!theme) return;

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('perguntas')
          .select('id, texto, opcoes, tema')
          .eq('tema', theme)
          .limit(limit);

        if (error) throw error;
        // Parse seguro do campo opcoes
        setQuestions((data || []).map(q => ({
          ...q,
          opcoes: Array.isArray(q.opcoes)
            ? q.opcoes
            : typeof q.opcoes === 'string'
              ? JSON.parse(q.opcoes)
              : []
        })));
      } catch (err) {
        console.error('Error fetching questions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [theme, limit]);

  return { questions, loading };
};
