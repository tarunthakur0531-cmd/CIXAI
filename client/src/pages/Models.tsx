import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Check, Loader2, Zap, Brain, Gauge, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Models() {
  const { user } = useAuth();
  const { data: models, isLoading } = trpc.models.list.useQuery(undefined);

  const modelIcons: Record<string, React.ReactNode> = {
    gpt: <Brain className="h-4 w-4 text-chart-2" />,
    claude: <Zap className="h-4 w-4 text-chart-3" />,
    gemini: <Gauge className="h-4 w-4 text-chart-4" />,
    mistral: <Cpu className="h-4 w-4 text-chart-5" />,
    default: <Cpu className="h-4 w-4 text-primary" />,
  };

  const getModelIcon = (id: string) => {
    const lowerId = id.toLowerCase();
    for (const key of Object.keys(modelIcons)) {
      if (lowerId.includes(key)) return modelIcons[key];
    }
    return modelIcons.default;
  };

  const getModelProvider = (id: string) => {
    const lowerId = id.toLowerCase();
    if (lowerId.includes('gpt') || lowerId.includes('openai')) return 'OpenAI';
    if (lowerId.includes('claude') || lowerId.includes('anthropic')) return 'Anthropic';
    if (lowerId.includes('gemini') || lowerId.includes('google')) return 'Google';
    if (lowerId.includes('mistral')) return 'Mistral';
    if (lowerId.includes('llama') || lowerId.includes('meta')) return 'Meta';
    return 'Other';
  };

  const copyModelId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Model ID copied");
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
            <Cpu className="h-6 w-6 text-chart-3" />
            MODEL GATEWAY
          </h1>
          <p className="text-muted-foreground font-mono text-sm">Select and manage LLM models powering your Second Brain</p>
        </div>

        <Card className="bg-card/50 border-chart-3/20">
          <CardContent className="py-4">
            <p className="font-mono text-xs text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Available LLM models are loaded dynamically. Select a model in the Brain Chat to use it for a specific session, or configure your default model in project settings.
            </p>
          </CardContent>
        </Card>

        {/* Available Models */}
        <div>
          <p className="font-mono text-xs text-muted-foreground mb-3 uppercase">Available Models</p>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {models?.map((model, i) => (
              <motion.div key={model.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="bg-card/50 border-border/30 hover:border-primary/20 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {getModelIcon(model.id)}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-medium truncate">{model.id}</p>
                        <p className="text-xs text-muted-foreground font-mono">{getModelProvider(model.id)}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyModelId(model.id)} className="shrink-0">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {models?.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground font-mono">
              No models available. Check your configuration.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
