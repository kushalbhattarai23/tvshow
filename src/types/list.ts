export interface List {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface ListItem {
  list_id: string;
  show: string;
}