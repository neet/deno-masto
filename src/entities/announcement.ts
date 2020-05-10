import { Emoji } from "./emoji.ts";
import { Mention } from "./mention.ts";
import { Reaction } from "./reaction.ts";
import { Tag } from "./tag.ts";

export interface Announcement {
  id: string;
  content: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  mentions: Mention[];
  tags: Tag[];
  emojis: Emoji[];
  reactions: Reaction[];
}
