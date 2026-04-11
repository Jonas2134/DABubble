export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface GroupedReaction {
  emoji: string;
  count: number;
  names: string[];
}
