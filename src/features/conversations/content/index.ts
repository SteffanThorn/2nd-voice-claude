import { buildContent } from "./build";
import {
  cafesAndRestaurants,
  everydayLife,
  family,
  home,
  leisure,
  sports,
  work,
} from "./topics-a";
import {
  conversationsWithChildren,
  conversationsWithElderlyPeople,
  healthAndWellbeing,
  meetingPeople,
  shopping,
  socialSituations,
  travel,
} from "./topics-b";

export const TOPIC_CONTENT = [
  everydayLife,
  home,
  family,
  work,
  sports,
  leisure,
  cafesAndRestaurants,
  shopping,
  travel,
  meetingPeople,
  conversationsWithChildren,
  conversationsWithElderlyPeople,
  healthAndWellbeing,
  socialSituations,
] as const;

/** Built once when the server starts. Later this comes from the database. */
export const CONTENT = buildContent(TOPIC_CONTENT);
