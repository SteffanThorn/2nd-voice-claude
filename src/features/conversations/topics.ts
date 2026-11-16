/**
 * Conversation topics.
 *
 * Temporary home: these will move into the `topics` database table once
 * Supabase is set up (see DATABASE_SCHEMA.md). Keeping the shape identical
 * means pages won't need to change much when that happens.
 *
 * Topics are shared across languages; only English names are stored here.
 * Māori topic names will be added once they have been human-verified.
 */

export type Topic = {
  /** URL-safe identifier, e.g. "cafes-and-restaurants". Never changes once published. */
  slug: string;
  name: string;
  description: string;
};

export const TOPICS: readonly Topic[] = [
  { slug: "everyday-life", name: "Everyday life", description: "Greetings, routines and the small talk of a normal day." },
  { slug: "home", name: "Home", description: "Around the house: rooms, chores, meals and family routines." },
  { slug: "family", name: "Family", description: "Talking about and with whānau: relationships, news and plans." },
  { slug: "work", name: "Work", description: "Colleagues, meetings, tasks and the workplace." },
  { slug: "sports", name: "Sports", description: "Playing, watching and talking about sport." },
  { slug: "leisure", name: "Leisure", description: "Hobbies, weekends, entertainment and free time." },
  { slug: "cafes-and-restaurants", name: "Cafés and restaurants", description: "Ordering, paying and chatting over food and drink." },
  { slug: "shopping", name: "Shopping", description: "Asking for things, prices and making choices." },
  { slug: "travel", name: "Travel", description: "Directions, transport, places and plans." },
  { slug: "meeting-people", name: "Meeting people", description: "Introductions, where you're from and getting to know someone." },
  { slug: "conversations-with-children", name: "Conversations with children", description: "Encouraging, instructing and playing with tamariki." },
  { slug: "conversations-with-elderly-people", name: "Conversations with elderly people", description: "Respectful conversation with kaumātua and older relatives." },
  { slug: "health-and-wellbeing", name: "Health and wellbeing", description: "How you're feeling, appointments and looking after yourself." },
  { slug: "social-situations", name: "Social situations", description: "Gatherings, invitations, celebrations and events." },
];

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}
