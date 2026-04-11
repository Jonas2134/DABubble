import { Pipe, PipeTransform } from '@angular/core';
import { Reaction, GroupedReaction } from '../interfaces/reaction.interface';

export interface ReactionViewModel extends GroupedReaction {
  namesLine: string;
  actionLine: string;
}

@Pipe({ name: 'groupReactions', standalone: true, pure: true })
export class GroupReactionsPipe implements PipeTransform {
  transform(reactions: Reaction[] | undefined, activeUserId: string | null): ReactionViewModel[] {
    if (!reactions?.length || !activeUserId) return [];
    return this.mapBucketsToViewModel(this.collectReactions(reactions, activeUserId));
  }

  private collectReactions(reactions: Reaction[], activeUserId: string): Map<string, { count: number; names: string[] }> {
    const grouped = new Map<string, { count: number; names: string[] }>();
    for (const r of reactions) {
      const name = r.userId === activeUserId ? 'Du' : r.userName;
      const bucket = grouped.get(r.emoji) ?? { count: 0, names: [] };
      bucket.count++;
      if (!bucket.names.includes(name)) bucket.names.push(name);
      grouped.set(r.emoji, bucket);
    }
    return grouped;
  }

  private mapBucketsToViewModel(buckets: Map<string, { count: number; names: string[] }>): ReactionViewModel[] {
    return Array.from(buckets, ([emoji, data]) => ({
      emoji,
      count: data.count,
      names: data.names,
      namesLine: this.buildNameLine(data.names),
      actionLine: this.buildActionLine(data.names, data.count),
    }));
  }

  private buildNameLine(names: string[], max = 3): string {
    const list = [...names];
    const idxDu = list.indexOf('Du');
    if (idxDu > 0) {
      list.splice(idxDu, 1);
      list.unshift('Du');
    }
    if (list.length <= max) {
      return list.join(', ').replace(/, ([^,]*)$/, ' und $1');
    }
    const first = list.slice(0, max).join(', ');
    const rest = list.length - max;
    return `${first} und ${rest === 1 ? 'ein weiterer' : rest + ' weitere'}`;
  }

  private buildActionLine(names: string[], count: number): string {
    return count === 1
      ? names[0] === 'Du' ? 'hast reagiert' : 'hat reagiert'
      : 'haben reagiert';
  }
}
