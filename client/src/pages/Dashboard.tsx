import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Brain, Zap, FileText, Bot, Activity, TrendingUp, Clock, Sparkles, Shield, Cpu, MemoryStick, Radio, Send, Sparkle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [captureText, setCaptureText] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  const { data: overview, isLoading } = trpc.dashboard.overview.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const captureMutation = trpc.thoughtCapture.quickCapture.useMutation({
    onSuccess: (data) => {
      setIsCapturing(false);
      setCaptureText("");
      toast.success(`Captured as "${data.category}" with tags: ${data.tags.join(", ")}`);
      utils.dashboard.overview.invalidate();
      utils.memories.list.invalidate();
    },
    onError: (err) => {
      setIsCapturing(false);
      toast.error(err.message);
    },
  });

  const handleCapture = () => {
    if (!captureText.trim() || isCapturing) return;
    setIsCapturing(true);
    captureMutation.mutate({ text: captureText.trim() });
  };

  const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="font-display text-4xl font-bold neon-text text-primary">CIX</div>
          <p className="text-muted-foreground text-lg">The Human Intelligence Layer</p>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your personal AI-powered second brain. Capture, store, search, and reason over your memories and knowledge.
          </p>
          <Button onClick={() => startLogin()} size="lg" className="font-mono tracking-wider">
            <Brain className="mr-2 h-5 w-5" />
            INITIALIZE BRAIN LINK
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-primary animate-pulse">Connecting to CIX Neural Network...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <motion.div {...fadeIn}>
          <div className="flex items-center gap-3 mb-1">
            <Brain className="h-7 w-7 text-primary" />
            <h1 className="font-display text-2xl font-bold tracking-wide">BRAIN ACTIVITY</h1>
            <Badge variant="secondary" className="font-mono text-xs glow-cyan">LIVE</Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm">Welcome back, {user?.name || 'Operator'}. Your neural cortex is operational.</p>
        </motion.div>

        {/* Quick Thought Capture */}
        <motion.div {...fadeIn} transition={{ delay: 0.03 }}>
          <Card className="bg-card/50 border-primary/20 neon-border-glow">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkle className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-mono text-xs text-primary uppercase tracking-wider">Quick Thought Capture</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={captureText}
                  onChange={(e) => setCaptureText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCapture(); } }}
                  placeholder="Type a thought, idea, or observation — AI will auto-tag it..."
                  className="font-mono bg-card/50 flex-1 border-primary/20"
                  disabled={isCapturing}
                />
                <Button
                  onClick={handleCapture}
                  disabled={!captureText.trim() || isCapturing}
                  size="icon"
                  className="shrink-0 bg-primary hover:bg-primary/80"
                >
                  {isCapturing ? (
                    <div className="h-4 w-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground uppercase">Memories</span>
                </div>
                <div className="text-2xl font-bold font-mono mt-1">{overview?.stats.total || 0}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  +{overview?.stats.recent24h || 0} last 24h
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
            <Card className="bg-card/50 border-accent/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-chart-2" />
                  <span className="text-xs font-mono text-muted-foreground uppercase">Tasks</span>
                </div>
                <div className="text-2xl font-bold font-mono mt-1">{overview?.stats.total ? 0 : 0}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  Pending: {overview?.cognitiveLoad?.taskLoad || 0}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
            <Card className="bg-card/50 border-chart-3/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-chart-3" />
                  <span className="text-xs font-mono text-muted-foreground uppercase">Agents</span>
                </div>
                <div className="text-2xl font-bold font-mono mt-1">{overview?.cognitiveLoad?.activeAgents || 0}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">Active now</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <Card className="bg-card/50 border-chart-5/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-chart-5" />
                  <span className="text-xs font-mono text-muted-foreground uppercase">Load</span>
                </div>
                <div className="text-2xl font-bold font-mono mt-1">
                  {Math.min((overview?.cognitiveLoad?.memoryCount || 0) * 2, 100)}%
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-1">Cognitive load</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Memories */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
            <Card className="bg-card/50 border-primary/10 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  RECENT CAPTURES
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overview?.recentMemories.length === 0 && (
                  <div className="text-muted-foreground font-mono text-sm py-4 text-center">
                    No memories captured yet. Start by adding your first thought.
                  </div>
                )}
                {overview?.recentMemories.map((m) => (
                  <div key={m.id} className="flex items-start gap-2 p-2 rounded border border-border/30 bg-muted/20">
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      {m.category}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title || m.content.slice(0, 50)}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Tasks */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
            <Card className="bg-card/50 border-accent/10 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-chart-2" />
                  ACTIVE TASKS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overview?.recentTasks.length === 0 && (
                  <div className="text-muted-foreground font-mono text-sm py-4 text-center">
                    No tasks yet. Create one from the Tasks page.
                  </div>
                )}
                {overview?.recentTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 p-2 rounded border border-border/30 bg-muted/20">
                    <Badge variant={t.status === 'done' ? 'default' : t.status === 'thinking' ? 'outline' : 'secondary'} className="text-[10px] font-mono">
                      {t.status}
                    </Badge>
                    <span className="text-sm flex-1 truncate">{t.title}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{t.priority}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Agents */}
          <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
            <Card className="bg-card/50 border-chart-3/10 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-chart-3" />
                  ACTIVE AGENTS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overview?.agents.length === 0 && (
                  <div className="text-muted-foreground font-mono text-sm py-4 text-center">
                    No agents deployed. Create agents to automate your workflows.
                  </div>
                )}
                {overview?.agents.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded border border-border/30 bg-muted/20">
                    <div className={`h-2 w-2 rounded-full ${a.status === 'active' ? 'bg-chart-3 animate-pulse' : a.status === 'paused' ? 'bg-yellow-500' : 'bg-muted-foreground/50'}`} />
                    <span className="text-sm flex-1">{a.name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{a.type}</Badge>
                    <Badge variant={a.status === 'active' ? 'default' : 'secondary'} className="text-[10px] font-mono">{a.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Insights */}
          <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
            <Card className="bg-card/50 border-chart-5/10 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-chart-5" />
                  BRAIN INSIGHTS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overview?.recentInsights.length === 0 && (
                  <div className="text-muted-foreground font-mono text-sm py-4 text-center">
                    No insights yet. Generate insights from the Insights page to start seeing patterns.
                  </div>
                )}
                {overview?.recentInsights.map((i) => (
                  <div key={i.id} className="p-2 rounded border border-border/30 bg-muted/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-mono">{i.type}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{i.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Events Log */}
        <motion.div {...fadeIn} transition={{ delay: 0.45 }}>
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-sm flex items-center gap-2">
                <Radio className="h-4 w-4 text-muted-foreground" />
                EVENT STREAM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                {overview?.recentEvents.length === 0 && (
                  <p className="text-muted-foreground py-2">No events recorded yet.</p>
                )}
                {overview?.recentEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 py-1 border-b border-border/20">
                    <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleTimeString()}</span>
                    <Badge variant="outline" className="text-[9px]">{e.type}</Badge>
                    <span className="text-muted-foreground truncate">
                      {e.payload ? JSON.stringify(e.payload).slice(0, 80) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
