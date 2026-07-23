import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Search, Plus, Trash2, Edit, X, Tag, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const categories = ['note', 'idea', 'decision', 'fact', 'observation', 'project', 'meeting', 'document', 'learning', 'research'] as const;

export default function Memories() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [form, setForm] = useState({ content: "", title: "", category: "note" as const, tags: "", project: "" });

  const utils = trpc.useUtils();
  const memoriesQuery = trpc.memories.list.useQuery(undefined);
  const searchQuery = trpc.memories.search.useQuery({ query: search }, { enabled: search.length > 2 });
  const createMutation = trpc.memories.create.useMutation({
    onSuccess: () => { utils.memories.list.invalidate(); setShowCreate(false); setForm({ content: "", title: "", category: "note" as const, tags: "", project: "" }); toast.success("Memory captured"); },
  });
  const deleteMutation = trpc.memories.delete.useMutation({
    onSuccess: () => { utils.memories.list.invalidate(); toast.success("Memory deleted"); },
  });
  const updateMutation = trpc.memories.update.useMutation({
    onSuccess: () => { utils.memories.list.invalidate(); setEditingId(null); toast.success("Memory updated"); },
  });

  const filteredMemories = useMemo(() => {
    let list = searchQuery.data || memoriesQuery.data || [];
    if (selectedCategory !== "all") list = list.filter(m => m.category === selectedCategory);
    return list;
  }, [searchQuery.data, memoriesQuery.data, selectedCategory]);

  // categories available from module-level constant

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              MEMORY ENGINE
            </h1>
            <p className="text-muted-foreground font-mono text-sm">Capture, store, search, and organize your knowledge</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="font-mono"><Plus className="mr-2 h-4 w-4" />NEW CAPTURE</Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-primary/20">
              <DialogHeader>
                <DialogTitle className="font-mono">New Memory Capture</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-mono text-xs">Title</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Give this memory a title..." className="font-mono" />
                </div>
                <div>
                  <Label className="font-mono text-xs">Content</Label>
                  <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="What's on your mind?" rows={5} className="font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-mono text-xs">Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v as any }))}>
                      <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c} className="font-mono">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-mono text-xs">Project</Label>
                    <Input value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="Optional..." className="font-mono" />
                  </div>
                </div>
                <div>
                  <Label className="font-mono text-xs">Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="ai, learning, important..." className="font-mono" />
                </div>
                <Button onClick={() => createMutation.mutate({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })} disabled={!form.content || createMutation.isPending} className="w-full font-mono">
                  CAPTURE MEMORY
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories..." className="pl-9 font-mono bg-card/50" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-32 font-mono bg-card/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="font-mono">{filteredMemories.length} results</Badge>
        </div>

        {/* Memory List */}
        <div className="space-y-3">
          {filteredMemories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-mono">
              No memories found. Create your first capture above.
            </div>
          )}
          {filteredMemories.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-mono">{m.category}</Badge>
                        {m.tags && (
                          <div className="flex gap-1 flex-wrap">
                            {JSON.parse(m.tags || '[]').map((t: string) => (
                              <span key={t} className="text-[10px] font-mono text-chart-2">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {m.title && <h3 className="font-medium text-sm mb-1">{m.title}</h3>}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{m.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(m.createdAt).toLocaleString()}</span>
                        {m.project && <span>Project: {m.project}</span>}
                        {m.confidenceScore && <span>Conf: {m.confidenceScore}%</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(m.id)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: m.id })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                  {editingId === m.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                      <Input value={m.title || ""} onChange={e => {}} placeholder="Title" className="font-mono" />
                      <Textarea value={m.content} onChange={e => {}} rows={3} className="font-mono" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => {
                          updateMutation.mutate({ id: m.id, content: m.content, title: m.title || undefined });
                        }}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
