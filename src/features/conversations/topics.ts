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
  /** Emoji shown on topic cards and the pathway header. */
  icon: string;
};

export const TOPICS: readonly Topic[] = [
  { slug: "everyday-life", name: "Everyday life", description: "Greetings, routines and the small talk of a normal day.", icon: "☀️" },
  { slug: "home", name: "Home", description: "Around the house: rooms, chores, meals and family routines.", icon: "🏠" },
  { slug: "family", name: "Family", description: "Talking about and with whānau: relationships, news and plans.", icon: "👨‍👩‍👧" },
  { slug: "work", name: "Work", description: "Colleagues, meetings, tasks and the workplace.", icon: "💼" },
  { slug: "sports", name: "Sports", description: "Playing, watching and talking about sport.", icon: "🏉" },
  { slug: "leisure", name: "Leisure", description: "Hobbies, weekends, entertainment and free time.", icon: "🎨" },
  { slug: "cafes-and-restaurants", name: "Cafés and restaurants", description: "Ordering, paying and chatting over food and drink.", icon: "☕" },
  { slug: "shopping", name: "Shopping", description: "Asking for things, prices and making choices.", icon: "🛍️" },
  { slug: "travel", name: "Travel", description: "Directions, transport, places and plans.", icon: "✈️" },
  { slug: "meeting-people", name: "Meeting people", description: "Introductions, where you're from and getting to know someone.", icon: "👋" },
  { slug: "conversations-with-children", name: "Conversations with children", description: "Encouraging, instructing and playing with tamariki.", icon: "🧒" },
  { slug: "conversations-with-elderly-people", name: "Conversations with elderly people", description: "Respectful conversation with kaumātua and older relatives.", icon: "👵" },
  { slug: "health-and-wellbeing", name: "Health and wellbeing", description: "How you're feeling, appointments and looking after yourself.", icon: "💚" },
  { slug: "social-situations", name: "Social situations", description: "Gatherings, invitations, celebrations and events.", icon: "🎉" },
];

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}
