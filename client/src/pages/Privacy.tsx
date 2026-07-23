import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Trash2, Eye, Download, Lock, AlertTriangle, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Privacy() {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const utils = trpc.useUtils();
  const { data: memories, isLoading } = trpc.memories.list.useQuery(undefined);
  const { data: tasks } = trpc.tasks.list.useQuery(undefined);
  const { data: chats } = trpc.chat.sessions.useQuery(undefined);
  const { data: insights } = trpc.insights.list.useQuery(undefined);

  const deleteAllMutation = trpc.privacy.deleteAllData.useMutation({
    onSuccess: () => {
      utils.memories.list.invalidate();
      utils.tasks.list.invalidate();
      utils.chat.sessions.invalidate();
      utils.insights.list.invalidate();
      toast.success("All brain data has been permanently deleted");
    },
  });

  const deleteMemoryMutation = trpc.privacy.deleteMemory.useMutation({
    onSuccess: () => {
      utils.memories.list.invalidate();
      toast.success("Memory entry deleted");
    },
  });

  const categoryCounts = useMemo(() => {
    if (!memories) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    memories.forEach(m => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, [memories]);

  const stats = {
    memories: memories?.length || 0,
    tasks: tasks?.length || 0,
    chatSessions: chats?.length || 0,
    insights: insights?.length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-4xl">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
            <Shield className="h-6 w-6 text-chart-3" />
            PRIVACY & DATA
          </h1>
          <p className="text-muted-foreground font-mono text-sm">Full transparency and control over your brain data</p>
        </div>

        {/* Data Overview */}
        <Card className="bg-card/50 border-primary/10">
          <CardHeader>
            <CardTitle className="font-mono text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              DATA OVERVIEW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-primary">{stats.memories}</p>
                <p className="text-xs font-mono text-muted-foreground">Memories</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-chart-2">{stats.tasks}</p>
                <p className="text-xs font-mono text-muted-foreground">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-chart-3">{stats.chatSessions}</p>
                <p className="text-xs font-mono text-muted-foreground">Chat Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-chart-5">{stats.insights}</p>
                <p className="text-xs font-mono text-muted-foreground">Insights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Entries with Per-Entry Delete */}
        <Card className="bg-card/50 border-border/30">
          <CardHeader>
            <CardTitle className="font-mono text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              MEMORY ENTRIES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading && <p className="text-muted-foreground font-mono text-sm text-center py-4">Loading...</p>}
              {memories?.length === 0 && !isLoading && (
                <p className="text-muted-foreground font-mono text-sm text-center py-4">No memories stored yet.</p>
              )}
              {memories?.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded bg-muted/20 hover:bg-muted/40 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{m.title || m.content.slice(0, 60)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">{m.category}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMemoryMutation.mutate({ id: m.id })}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Info */}
        <Card className="bg-card/50 border-chart-3/20">
          <CardHeader>
            <CardTitle className="font-mono text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-chart-3" />
              DATA SOVEREIGNTY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-2 rounded bg-muted/20">
              <Check className="h-4 w-4 text-chart-3 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-mono">All data is isolated per user — no cross-user access</p>
                <p className="text-xs text-muted-foreground font-mono">Your memories, tasks, and insights are only accessible by you</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded bg-muted/20">
              <Check className="h-4 w-4 text-chart-3 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-mono">Full data transparency</p>
                <p className="text-xs text-muted-foreground font-mono">You can view, edit, and delete all data at any time</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded bg-muted/20">
              <Check className="h-4 w-4 text-chart-3 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-mono">LLM processing is transient</p>
                <p className="text-xs text-muted-foreground font-mono">Memory content sent to AI models is not stored externally</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card/50 border-destructive/30">
          <CardHeader>
            <CardTitle className="font-mono text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              DANGER ZONE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground font-mono">
              Permanently delete all your brain data. This action cannot be undone.
            </p>
            {!confirmDelete ? (
              <Button variant="destructive" onClick={() => setConfirmDelete(true)} className="font-mono">
                <Trash2 className="mr-2 h-4 w-4" />
                DELETE ALL DATA
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-mono text-destructive">
                  Are you sure? This will delete all memories, tasks, chat sessions, and insights.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => deleteAllMutation.mutate()} disabled={deleteAllMutation.isPending} className="font-mono">
                    {deleteAllMutation.isPending ? 'DELETING...' : 'CONFIRM DELETE ALL'}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmDelete(false)} className="font-mono">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
