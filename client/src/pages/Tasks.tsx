import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ClipboardList, Plus, Trash2, Check, Brain, Clock, Cpu, Zap, Pause, Play, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Tasks() {
  const { user } = useAuth();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium" as const });
  const [agentForm, setAgentForm] = useState({ name: "", type: "automation", description: "" });

  const utils = trpc.useUtils();
  const { data: tasks } = trpc.tasks.list.useQuery(
    filterStatus !== "all" ? { status: filterStatus as any } : undefined
  );
  const { data: agents } = trpc.agents.list.useQuery(undefined);

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); setShowCreateTask(false); setTaskForm({ title: "", description: "", priority: "medium" }); toast.success("Task created"); },
    onError: (err) => toast.error(err.message),
  });
  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task updated"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task deleted"); },
  });

  const createAgentMutation = trpc.agents.create.useMutation({
    onSuccess: () => { utils.agents.list.invalidate(); setShowCreateAgent(false); setAgentForm({ name: "", type: "monitor", description: "" }); toast.success("Agent created"); },
    onError: (err) => toast.error(err.message),
  });
  const updateAgentMutation = trpc.agents.update.useMutation({
    onSuccess: () => { utils.agents.list.invalidate(); toast.success("Agent updated"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteAgentMutation = trpc.agents.delete.useMutation({
    onSuccess: () => { utils.agents.list.invalidate(); toast.success("Agent deleted"); },
    onError: (err) => toast.error(err.message),
  });

  // LLM Task Decomposition
  const decomposeMutation = trpc.tasks.decompose.useMutation({
    onSuccess: (data) => {
      utils.tasks.list.invalidate();
      toast.success(`Task decomposed into ${data.subtasks.length} subtasks`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    thinking: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    done: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    thinking: <Brain className="h-3 w-3 animate-pulse" />,
    done: <Check className="h-3 w-3" />,
  };

  const agentStatusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    idle: 'bg-muted text-muted-foreground',
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-chart-2" />
              TASK & AGENT QUEUE
            </h1>
            <p className="text-muted-foreground font-mono text-sm">Manage tasks with LLM-powered decomposition</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
              <DialogTrigger asChild>
                <Button className="font-mono"><Plus className="mr-2 h-4 w-4" />NEW TASK</Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-primary/20">
                <DialogHeader>
                  <DialogTitle className="font-mono">Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="font-mono text-xs">Title</Label>
                    <Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" className="font-mono" />
                  </div>
                  <div>
                    <Label className="font-mono text-xs">Description</Label>
                    <Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Add details..." rows={3} className="font-mono" />
                  </div>
                  <div>
                    <Label className="font-mono text-xs">Priority</Label>
                    <Select value={taskForm.priority} onValueChange={(v) => setTaskForm(f => ({ ...f, priority: v as any }))}>
                      <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => createTaskMutation.mutate(taskForm)} disabled={!taskForm.title || createTaskMutation.isPending} className="w-full font-mono">
                    CREATE TASK
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showCreateAgent} onOpenChange={setShowCreateAgent}>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-mono"><Cpu className="mr-2 h-4 w-4" />NEW AGENT</Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-primary/20">
                <DialogHeader>
                  <DialogTitle className="font-mono">Create New Agent</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="font-mono text-xs">Agent Name</Label>
                    <Input value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Memory Organizer" className="font-mono" />
                  </div>
                  <div>
                    <Label className="font-mono text-xs">Type</Label>
                    <Select value={agentForm.type} onValueChange={(v) => setAgentForm(f => ({ ...f, type: v as any }))}>
                      <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automation">Automation</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-mono text-xs">Description</Label>
                    <Textarea value={agentForm.description} onChange={e => setAgentForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this agent do?" rows={3} className="font-mono" />
                  </div>
                  <Button onClick={() => createAgentMutation.mutate(agentForm as any)} disabled={!agentForm.name || createAgentMutation.isPending} className="w-full font-mono">
                    CREATE AGENT
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList className="bg-card/50 border border-border/30">
            <TabsTrigger value="tasks" className="font-mono text-xs data-[state=active]:bg-primary/20">TASKS</TabsTrigger>
            <TabsTrigger value="agents" className="font-mono text-xs data-[state=active]:bg-primary/20">AGENTS</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-3 mt-4">
            {/* Status Filters */}
            <div className="flex gap-2">
              {['all', 'pending', 'thinking', 'done'].map(status => (
                <Button key={status} variant={filterStatus === status ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus(status)} className="font-mono text-xs">
                  {status === 'all' ? 'All' : status.toUpperCase()}
                </Button>
              ))}
            </div>

            {/* Task List */}
            {tasks?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-mono">
                No tasks found. Create your first task above.
              </div>
            )}
            {tasks?.map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="bg-card/50 border-border/30 hover:border-primary/20 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border ${statusColors[task.status]}`}>
                        {statusIcons[task.status]}
                        {task.status}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1">{task.title}</h3>
                        {task.description && <p className="text-xs text-muted-foreground font-mono line-clamp-2">{task.description}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-[10px] font-mono">{task.priority}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            Progress: {task.progress}%
                          </span>
                        </div>
                        <Progress value={task.progress || 0} className="mt-2 h-1" />
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {task.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'thinking' })} title="Start thinking">
                              <Brain className="h-3.5 w-3.5 text-chart-2" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => decomposeMutation.mutate({ id: task.id })} title="Decompose with LLM">
                              <Zap className="h-3.5 w-3.5 text-chart-4" />
                            </Button>
                          </>
                        )}
                        {task.status === 'thinking' && (
                          <Button variant="ghost" size="icon" onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'done', progress: 100 })} title="Mark done">
                            <Check className="h-3.5 w-3.5 text-chart-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteTaskMutation.mutate({ id: task.id })}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {task.result && (
                      <div className="mt-3 p-2 rounded bg-muted/30 border border-border/20">
                        <p className="text-xs font-mono text-chart-3">Result:</p>
                        <p className="text-xs font-mono mt-1">{task.result}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-3 mt-4">
            {agents?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-mono">
                No agents deployed. Create an agent to automate your workflows.
              </div>
            )}
            {agents?.map((agent, i) => (
              <motion.div key={agent.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="bg-card/50 border-border/30 hover:border-chart-3/20 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border ${agentStatusColors[agent.status]}`}>
                        {agent.status === 'active' && <Activity className="h-3 w-3" />}
                        {agent.status === 'paused' && <Pause className="h-3 w-3" />}
                        {agent.status === 'idle' && <Clock className="h-3 w-3" />}
                        {agent.status}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{agent.name}</h3>
                          <Badge variant="outline" className="text-[10px] font-mono">{agent.type}</Badge>
                        </div>
                        {agent.description && <p className="text-xs text-muted-foreground font-mono mt-1 line-clamp-2">{agent.description}</p>}
                        {agent.config && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate">
                            Config: {agent.config.length > 80 ? agent.config.slice(0, 80) + '...' : agent.config}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {agent.status === 'idle' && (
                          <Button variant="ghost" size="icon" onClick={() => updateAgentMutation.mutate({ id: agent.id, status: 'active' })} title="Activate">
                            <Play className="h-3.5 w-3.5 text-green-500" />
                          </Button>
                        )}
                        {agent.status === 'active' && (
                          <Button variant="ghost" size="icon" onClick={() => updateAgentMutation.mutate({ id: agent.id, status: 'paused' })} title="Pause">
                            <Pause className="h-3.5 w-3.5 text-yellow-500" />
                          </Button>
                        )}
                        {agent.status === 'paused' && (
                          <Button variant="ghost" size="icon" onClick={() => updateAgentMutation.mutate({ id: agent.id, status: 'active' })} title="Resume">
                            <Play className="h-3.5 w-3.5 text-green-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteAgentMutation.mutate({ id: agent.id })}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
