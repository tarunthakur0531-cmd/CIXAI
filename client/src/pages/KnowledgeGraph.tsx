import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  size: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

const nodeColors: Record<string, string> = {
  memory: '#a855f7',
  task: '#06b6d4',
  agent: '#22c55e',
  note: '#a855f7',
  idea: '#f59e0b',
  decision: '#ef4444',
  fact: '#3b82f6',
  observation: '#14b8a6',
  project: '#8b5cf6',
  meeting: '#ec4899',
  document: '#6b7280',
  learning: '#0ea5e9',
  research: '#6366f1',
};

export default function KnowledgeGraph() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);

  const { data: graphData, isLoading, refetch } = trpc.graph.get.useQuery(undefined);

  useEffect(() => {
    if (graphData) {
      const initialNodes = graphData.nodes.map((n, i) => ({
        ...n,
        x: Math.random() * 600 - 300,
        y: Math.random() * 600 - 300,
        vx: 0,
        vy: 0,
      }));
      setNodes(initialNodes);
      setEdges(graphData.edges);
    }
  }, [graphData]);

  // Simple force-directed layout
  useEffect(() => {
    if (nodes.length === 0) return;

    const animate = () => {
      setNodes(prev => {
        const updated = prev.map(n => ({ ...n }));
        const alpha = 0.3;

        // Repulsion
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const dx = (updated[j].x || 0) - (updated[i].x || 0);
            const dy = (updated[j].y || 0) - (updated[i].y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 8000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (updated[i].fx === undefined) { updated[i].vx = (updated[i].vx || 0) - fx * alpha; updated[i].vy = (updated[i].vy || 0) - fy * alpha; }
            if (updated[j].fx === undefined) { updated[j].vx = (updated[j].vx || 0) + fx * alpha; updated[j].vy = (updated[j].vy || 0) + fy * alpha; }
          }
        }

        // Attraction (edges)
        edges.forEach(edge => {
          const s = updated.find(n => n.id === edge.source);
          const t = updated.find(n => n.id === edge.target);
          if (!s || !t) return;
          const dx = (t.x || 0) - (s.x || 0);
          const dy = (t.y || 0) - (s.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 120) * 0.001 * edge.strength;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (s.fx === undefined) { s.vx = (s.vx || 0) + fx * alpha; s.vy = (s.vy || 0) + fy * alpha; }
          if (t.fx === undefined) { t.vx = (t.vx || 0) - fx * alpha; t.vy = (t.vy || 0) - fy * alpha; }
        });

        // Center gravity
        updated.forEach(n => {
          if (n.fx !== undefined) return;
          n.vx = (n.vx || 0) * 0.8 - (n.x || 0) * 0.001;
          n.vy = (n.vy || 0) * 0.8 - (n.y || 0) * 0.001;
          n.x = (n.x || 0) + (n.vx || 0);
          n.y = (n.y || 0) + (n.vy || 0);
        });

        return updated;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [edges]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    edges.forEach(edge => {
      const s = nodes.find(n => n.id === edge.source);
      const t = nodes.find(n => n.id === edge.target);
      if (!s || !t || !s.x || !s.y || !t.x || !t.y) return;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 * edge.strength})`;
      ctx.lineWidth = 1 * edge.strength;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(node => {
      if (!node.x || !node.y) return;
      const color = nodeColors[node.type] || nodeColors[node.category] || '#a855f7';
      const isSelected = selectedNode?.id === node.id;

      // Glow
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + 6, 0, Math.PI * 2);
        ctx.fillStyle = `${color}22`;
        ctx.fill();
      }

      // Node
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = `${color}88`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label.slice(0, 20), node.x, node.y + node.size + 14);
    });

    ctx.restore();
  }, [nodes, edges, zoom, pan, selectedNode]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) - canvas.width / 2 - pan.x) / zoom;
    const y = ((e.clientY - rect.top) - canvas.height / 2 - pan.y) / zoom;

    // Find closest node
    let closest: GraphNode | null = null;
    let minDist = 20;
    nodes.forEach(node => {
      if (!node.x || !node.y) return;
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = node;
      }
    });

    setSelectedNode(closest);
  }, [nodes, zoom, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.2, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              KNOWLEDGE GRAPH
            </h1>
            <p className="text-muted-foreground font-mono text-sm">Visualize connections between your memories, tasks, and agents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.2))}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => { refetch(); toast.info("Refreshing graph..."); }}><RotateCcw className="h-4 w-4 mr-1" />Refresh</Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Graph Canvas */}
          <div ref={containerRef} className="lg:col-span-3 relative bg-card/30 rounded-lg border border-border/30 overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <p className="font-mono text-sm text-primary animate-pulse">Computing neural pathways...</p>
              </div>
            )}
            {!isLoading && nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-mono text-sm text-muted-foreground">No connections yet. Start capturing memories to build your knowledge graph.</p>
              </div>
            )}
          </div>

          {/* Node Details Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-card/50 border-primary/10 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm">NODE DETAILS</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedNode ? (
                  <div className="space-y-3">
                    <div>
                      <Badge variant="outline" className="font-mono text-[10px]">{selectedNode.type}</Badge>
                      <Badge variant="outline" className="font-mono text-[10px] ml-1">{selectedNode.category}</Badge>
                    </div>
                    <p className="font-mono text-sm font-medium">{selectedNode.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Node size: {selectedNode.size}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Position: ({Math.round(selectedNode.x || 0)}, {Math.round(selectedNode.y || 0)})
                    </p>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-xs font-mono text-muted-foreground mb-1">Connected edges:</p>
                      <p className="text-xs font-mono">{edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} connections</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground font-mono text-xs text-center py-8">
                    Click a node to view details
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="bg-card/50 border-border/20 mt-3">
              <CardContent className="py-3">
                <p className="font-mono text-xs text-muted-foreground mb-2">LEGEND</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-500" /><span className="text-[10px] font-mono">Memories</span></div>
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-500" /><span className="text-[10px] font-mono">Tasks</span></div>
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" /><span className="text-[10px] font-mono">Agents</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
