// Lộ trình và danh sách bài lấy từ curriculum/syllabus.json (nguồn duy nhất).
// Thêm lộ trình mới: thêm vào "tracks" trong syllabus.json, tạo thư mục src/content/lessons/<id>/.
import syllabus from '../../curriculum/syllabus.json';

export type EngineId = 'sqlite' | 'postgres';
export type TrackId = string;
export type LessonStatus = 'planned' | 'drafting' | 'done' | 'rewrite';

export interface Track {
  id: TrackId;
  name: string;
  summary: string;
  level: string;
  /** Engine chạy trong trình duyệt cho các bài của lộ trình này */
  engine: EngineId;
  requires: TrackId[];
}

export interface PlannedLesson {
  id: string;
  order: number;
  module: string;
  title: string;
  objectives: string[];
  status: LessonStatus;
}

type RawTrack = Omit<Track, 'id'> & Record<string, unknown>;

export const tracks: Track[] = Object.entries(syllabus.tracks as Record<string, RawTrack>).map(([id, t]) => ({
  id,
  name: t.name,
  summary: t.summary,
  level: t.level,
  engine: t.engine,
  requires: t.requires ?? [],
}));

export const trackById = (id: string) => tracks.find((t) => t.id === id);

export const plannedLessons = (track: TrackId): PlannedLesson[] =>
  (syllabus.lessons as PlannedLesson[])
    .filter((l) => l.id.startsWith(`${track}/`))
    .sort((a, b) => a.order - b.order);
