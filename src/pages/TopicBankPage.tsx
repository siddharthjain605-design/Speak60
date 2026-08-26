import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { getAllTopics, DIFFICULTY_LABELS } from '../lib/topicEngine';
import { CATEGORIES, type Difficulty, type TopicType } from '../data/topics';
import type { RawTopic } from '../types';
import { Card, Pill, PrimaryButton, SecondaryButton, SectionTitle, StatTile } from '../components/ui';

const TYPES: TopicType[] = ['knowledge', 'opinion', 'abstract', 'hypothetical'];

function toCsv(topics: ReturnType<typeof getAllTopics>): string {
  const header = 'text,category,subcategory,difficulty,type,active,timesUsed,lastUsedDate';
  const rows = topics.map((t) =>
    [t.text, t.category, t.subcategory, t.difficulty, t.type, t.active, t.timesUsed, t.lastUsedDate ?? '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header, ...rows].join('\n');
}

function parseCsv(text: string): RawTopic[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const out: RawTopic[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) ?? [];
    const [text, category, subcategory, difficulty, type] = cells;
    if (!text || !category) continue;
    const diff = Math.min(5, Math.max(1, Number(difficulty) || 2)) as Difficulty;
    const t = (TYPES.includes(type as TopicType) ? type : 'opinion') as TopicType;
    out.push({ text, category, subcategory: subcategory || 'General', difficulty: diff, type: t });
  }
  return out;
}

export default function TopicBankPage() {
  const store = useStore();
  const allTopics = useMemo(() => getAllTopics(store), [store]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ text: '', category: CATEGORIES[0], subcategory: 'General', difficulty: 2 as Difficulty, type: 'opinion' as TopicType });

  const filtered = allTopics.filter((t) => {
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (search && !t.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleExport() {
    const csv = toCsv(allTopics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'speak60-topic-bank.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result));
      if (parsed.length > 0) store.addCustomTopics(parsed);
    };
    reader.readAsText(file);
  }

  function handleAddTopic() {
    if (!form.text.trim()) return;
    store.addCustomTopics([{ ...form, text: form.text.trim() }]);
    setForm({ ...form, text: '' });
    setShowAddForm(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total Topics" value={allTopics.length} tone="accent" />
        <StatTile label="Active" value={allTopics.filter((t) => t.active).length} tone="good" />
        <StatTile label="Categories" value={CATEGORIES.length} />
        <StatTile label="Custom Added" value={store.customTopics.length} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics…"
            className="min-w-[200px] flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          >
            <option>All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <SecondaryButton onClick={() => setShowAddForm((s) => !s)}>+ Add Topic</SecondaryButton>
          <SecondaryButton onClick={handleExport}>Export CSV</SecondaryButton>
          <SecondaryButton onClick={() => fileInputRef.current?.click()}>Import CSV</SecondaryButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
          />
        </div>

        {showAddForm && (
          <div className="mt-4 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:grid-cols-2">
            <input
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Topic text"
              className="sm:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input
              value={form.subcategory}
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              placeholder="Subcategory"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) as Difficulty })} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
              {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TopicType })} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <div className="sm:col-span-2">
              <PrimaryButton onClick={handleAddTopic}>Save Topic</PrimaryButton>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle sub={`Showing ${filtered.length} of ${allTopics.length} topics`}>Topic Bank</SectionTitle>
        <div className="max-h-[32rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-900">
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2 pr-2">Topic</th>
                <th className="py-2 pr-2">Category</th>
                <th className="py-2 pr-2">Difficulty</th>
                <th className="py-2 pr-2">Used</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 300).map((t) => (
                <tr key={t.id} className="border-t border-zinc-800/70 align-top">
                  <td className="max-w-xs py-2 pr-2 text-zinc-200">{t.text}</td>
                  <td className="py-2 pr-2 text-zinc-400">{t.category}</td>
                  <td className="py-2 pr-2"><Pill>{DIFFICULTY_LABELS[t.difficulty]}</Pill></td>
                  <td className="py-2 pr-2 text-zinc-500">{t.timesUsed}×</td>
                  <td className="py-2 pr-2">{t.active ? <Pill tone="good">Active</Pill> : <Pill tone="bad">Inactive</Pill>}</td>
                  <td className="py-2">
                    <SecondaryButton onClick={() => store.setTopicActive(t.id, !t.active)} className="px-3 py-1 text-xs">
                      {t.active ? 'Deactivate' : 'Activate'}
                    </SecondaryButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 300 && (
            <p className="mt-2 text-center text-xs text-zinc-600">Showing first 300 results — refine your search to see more.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
