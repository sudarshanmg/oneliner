export type Sentence = {
  id: string;
  parent_id: string | null;
  body: string;
  author_token: string;
  author_name: string;
  votes: number;
  created_at: string;
};

export type Vote = {
  sentence_id: string;
  author_token: string;
};

export type NarratorLog = {
  id: string;
  date: string;
  summary: string;
  canonical_path: Sentence[];
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      sentences: {
        Row: Sentence;
        Insert: Omit<Sentence, "id" | "created_at" | "votes"> & {
          id?: string;
          created_at?: string;
          votes?: number;
        };
        Update: Partial<Sentence>;
      };
      votes: {
        Row: Vote;
        Insert: Vote;
        Update: Partial<Vote>;
      };
      narrator_log: {
        Row: NarratorLog;
        Insert: Omit<NarratorLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<NarratorLog>;
      };
    };
  };
};
