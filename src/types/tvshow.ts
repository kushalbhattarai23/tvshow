export type ShowStatus = 'Currently Watching' | 'Completed' | 'Plan to Watch' | 'Dropped';

export interface TVShow {
  id: string;
  Show: string;
  Episode: string;
  'Air Date': string;
  Watched: boolean;
  Title: string;
  status: ShowStatus;
  total_episodes: number | null;
  episodes_watched: number;
}