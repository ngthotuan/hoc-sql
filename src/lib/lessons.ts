import { getCollection, type CollectionEntry } from 'astro:content';
import type { TrackId } from '../data/tracks';
import { withBase } from './url';

export type Lesson = CollectionEntry<'lessons'>;

export const trackOf = (l: Lesson) => l.id.split('/')[0] as TrackId;
export const slugOf = (l: Lesson) => l.id.split('/').slice(1).join('/');
export const urlOf = (l: Lesson) => withBase(`/${trackOf(l)}/${slugOf(l)}/`);

export async function lessonsByTrack(track: TrackId) {
  const all = await getCollection('lessons', (l: Lesson) => trackOf(l) === track);
  return all.sort((a: Lesson, b: Lesson) => a.data.order - b.data.order);
}
