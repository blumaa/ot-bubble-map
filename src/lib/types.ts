export interface Recording {
  url: string;
  tune: string;
  tuneSlug: string;
  artist: string | null;
  playedBy: string | null;
  key: string | null;
  tuning: string | null;
  year: number | null;
  mediaSource: string | null;
  collections: string[];
  audio: string | null;
}
