export interface Channel {
  id: string;
  name: string;
  description: string | null;
  createdByUser: string;
  memberIds: string[];
  createdAt: Date | string;
}
