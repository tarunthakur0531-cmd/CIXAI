import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Calendar, TrendingUp, Brain, Lightbulb, Target, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Streamdown } from 'streamdown';

const typeIcons: Record<string, React.ReactNode> = {
  daily: <Calendar className="h-4 w-4 text-chart-1" />,
  weekly: <TrendingUp className="h-4 w-4 text-chart-2" />,
  monthly: <Calendar className="h-4 w-4 text-chart-3" />,
  pattern: <Brain className="h-4 w-4 text-chart-4" />,
  opportunity: <Target className="h-4 w-4 text-chart-5" />,
  prediction: <Lightbulb className="h-4 w-4 text-primary" />,
  reflection: <Eye className="h-4 w-4 text-muted-foreground" />,
};

export default function Insights() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);

  const utils = trpc.useUtils();
  const { data: insights, isLoading } = trpc.insights.list.useQuery(undefined);
  const generateMutation = trpc.insights.generate.useMutation({
    onMutate: () => setGenerating(true),
    onSuccess: () => {
      utils.insights.list.invalidate();
      setGenerating(false);
      toast.success("Brain insights generated successfully");
    },
    onError: (err) => {
      setGenerating(false);
      toast.error("Failed to generate insights");
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-chart-5" />
              BRAIN INSIGHTS
            </h1>
            <p className="text-muted-foreground font-mono text-sm">AI-generated summaries, patterns, and behavioral trends</p>
          </div>
          <Button onClick={() => generateMutation.mutate()} disabled={generating} className="font-mono">
            <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'GENERATING...' : 'GENERATE INSIGHTS'}
          </Button>
        </div>

        <div className="space-y-3">
          {insights?.length === 0 && !generating && (
            <div className="text-center py-16">
              <Sparkles className="h-12 w-12 text-primary/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-mono text-sm mb-4">No insights generated yet.</p>
              <p className="text-muted-foreground font-mono text-xs max-w-md mx-auto">
                Click "Generate Insights" to analyze your memories and discover patterns, trends, and actionable recommendations.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-16">
              <p className="font-mono text-sm text-primary animate-pulse">Loading insights...</p>
            </div>
          )}

          {insights?.map((insight, i) => (
            <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-card/50 border-border/30 hover:border-primary/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {typeIcons[insight.type] || <Sparkles className="h-4 w-4 text-primary" />}
                      <CardTitle className="font-mono text-sm">{insight.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{insight.type}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{insight.content}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
