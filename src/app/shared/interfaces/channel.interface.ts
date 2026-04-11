export interface Channel {
  id?: string | null;
  name: string;
  description: string | null;
  createdByUser: string;
  memberIds: string[];
  createdAt: Date | string;
}
