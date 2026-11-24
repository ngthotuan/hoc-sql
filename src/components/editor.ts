// Tách riêng để CodeMirror (~150 KB) chỉ tải sau khi playground hiện ra.
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, bracketMatching } from '@codemirror/language';
import { sql, SQLite, PostgreSQL } from '@codemirror/lang-sql';
import { tags as t } from '@lezer/highlight';

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: 'var(--code-keyword)', fontWeight: '600' },
  { tag: [t.string, t.special(t.string)], color: 'var(--code-string)' },
  { tag: t.number, color: 'var(--code-number)' },
  { tag: t.lineComment, color: 'var(--ink-soft)', fontStyle: 'italic' },
  { tag: t.blockComment, color: 'var(--ink-soft)', fontStyle: 'italic' },
  { tag: [t.typeName, t.standard(t.name)], color: 'var(--code-type)' },
]);

const theme = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'var(--ink)' },
  '.cm-content': { padding: '0.9rem 0' },
  // Cỡ chữ của cột số dòng phải bằng nội dung, nếu không số sẽ lệch khỏi dòng code
  '.cm-scroller': { fontFamily: 'var(--font-code)', fontSize: '0.95rem', lineHeight: '1.6' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--ink-faint)',
    border: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 0.6rem 0 0.9rem', minWidth: '2.2rem' },
  '.cm-activeLine': { backgroundColor: 'var(--line-active)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--ink-soft)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: 'var(--ink)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--selection) !important',
  },
});

export function mountEditor(opts: {
  parent: HTMLElement;
  doc: string;
  dialect: 'sqlite' | 'postgres';
  label: string;
  onRun: () => void;
}) {
  const runKey = { key: 'Mod-Enter', run: () => (opts.onRun(), true) };
  return new EditorView({
    parent: opts.parent,
    state: EditorState.create({
      doc: opts.doc,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        keymap.of([runKey, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        sql({ dialect: opts.dialect === 'postgres' ? PostgreSQL : SQLite, upperCaseKeywords: true }),
        syntaxHighlighting(highlight),
        theme,
        EditorView.contentAttributes.of({ 'aria-label': opts.label }),
      ],
    }),
  });
}
