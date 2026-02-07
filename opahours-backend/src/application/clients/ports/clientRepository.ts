export interface ClientSummary {
  id: string;
  name: string;
  abn: string | null;
}

export interface ClientRepository {
  list(): Promise<ClientSummary[]>;
  exists(id: string): Promise<boolean>;
}
