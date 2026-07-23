import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, MessageSquare, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function BrainChat() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const { data: sessions } = trpc.chat.sessions.useQuery(undefined);
  const { data: models } = trpc.models.list.useQuery(undefined);
  const messagesQuery = trpc.chat.messages.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      utils.chat.messages.invalidate({ sessionId: data.sessionId });
      utils.chat.sessions.invalidate();
      setIsStreaming(false);
      setInput("");
    },
    onError: (err) => {
      setIsStreaming(false);
      toast.error(err.message);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    setIsStreaming(true);
    sendMutation.mutate({
      sessionId: sessionId || undefined,
      message: input.trim(),
      modelId: (selectedModel && selectedModel !== 'default') ? selectedModel : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              BRAIN CHAT
            </h1>
            <p className="text-muted-foreground font-mono text-sm">Query your second brain with AI intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-48 font-mono text-xs bg-card/50">
                <SelectValue placeholder="Select model..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default" className="font-mono">Default Model</SelectItem>
                {models?.map(m => (
                  <SelectItem key={m.id} value={m.id} className="font-mono">{m.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sessions sidebar hint */}
        {sessions && sessions.length > 0 && !sessionId && (
          <div className="mb-3 shrink-0">
            <p className="text-xs font-mono text-muted-foreground mb-1">Recent sessions:</p>
            <div className="flex gap-2 flex-wrap">
              {sessions.slice(0, 5).map(s => (
                <Button key={s.id} variant="outline" size="sm" className="font-mono text-xs" onClick={() => setSessionId(s.id)}>
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {s.title || 'Session'}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {!sessionId && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="h-12 w-12 text-primary/30 mb-4" />
              <h2 className="font-display text-lg font-bold mb-2">CIX Neural Interface</h2>
              <p className="text-muted-foreground font-mono text-sm max-w-md">
                Ask questions about your memories, request summaries, get decision support, or explore patterns in your knowledge base.
              </p>
            </div>
          )}
          <AnimatePresence>
            {messagesQuery.data?.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Card className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary/10 border-primary/20' : 'bg-card/50 border-border/30'}`}>
                  <CardContent className="py-3 px-4">
                    <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{msg.content}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
                {msg.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isStreaming && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <Card className="bg-card/50 border-primary/20">
                <CardContent className="py-3 px-4">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your second brain anything..."
              className="font-mono bg-card/50 flex-1"
              disabled={isStreaming}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isStreaming} size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {selectedModel && (
            <Badge variant="outline" className="font-mono text-[10px] mt-1">
              Model: {selectedModel}
            </Badge>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
