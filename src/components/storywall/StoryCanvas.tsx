import { useCallback, useState, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    BackgroundVariant,
    type Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';

import EntityNode from './EntityNode';
import InspectorPanel from '../inspector/InspectorPanel';
import CanvasToolbar from './CanvasToolbar';
import AddEntityModal from './AddEntityModal';
import TeamManager from '../case/TeamManager';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const nodeTypes = {
    entity: EntityNode as any,
};

export default function StoryCanvas() {
    const [searchParams] = useSearchParams();
    const caseId = searchParams.get('caseId'); // Fixed param name to match Dashboard

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

    if (!caseId) {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: '#71717a'
            }}>
                <h2>No Operation Selected</h2>
                <p>Please select an active operation from the Dashboard.</p>
            </div>
        );
    }

    // Fetch Graph Data
    const fetchData = useCallback(async () => {
        if (!caseId) return;
        try {
            const data = await apiClient.get(`/cases/${caseId}`);
            if (data.nodes) {
                setNodes(data.nodes.map((n: any) => ({
                    id: n.id,
                    type: 'entity',
                    position: { x: n.x, y: n.y },
                    data: {
                        id: n.id,
                        label: n.label,
                        type: n.type,
                        detail: n.detail,
                        id_short: n.id.substring(0, 8),
                        meta: n.data ? JSON.parse(n.data) : {}
                    }
                })));
            }
            if (data.edges) {
                // Determine if this is first load to apply delay
                const mappedEdges = data.edges.map((e: any) => ({
                    id: e.id,
                    source: e.sourceId,
                    target: e.targetId,
                    label: e.label,
                    style: { stroke: '#4a5059', strokeWidth: 1 }
                }));
                // HACK: Small delay ensuring nodes are registered before edges connect
                setTimeout(() => {
                    setEdges(mappedEdges);
                }, 50);
            }
        } catch (err) {
            console.error("Failed to load graph:", err);
        }
    }, [caseId, setNodes, setEdges]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Polling for updates
        return () => clearInterval(interval);
    }, [fetchData]);


    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) => addEdge(params, eds));
            if (caseId && params.source && params.target) {
                apiClient.post('/edges', {
                    caseId,
                    sourceId: params.source,
                    targetId: params.target,
                    label: 'RELATED_TO'
                }).catch(err => console.error("Failed to create edge:", err));
            }
        },
        [setEdges, caseId],
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node.data);
    }, []);

    const onEdgeClick = useCallback((_: React.MouseEvent, edge: any) => {
        setSelectedNode({
            id: edge.id,
            type: 'edge',
            label: edge.label || 'RELATED_TO',
            detail: `Source: ${edge.source}\nTarget: ${edge.target}`
        });
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
        // Persist position to backend
        apiClient.put(`/nodes/${node.id}/position`, {
            x: node.position.x,
            y: node.position.y
        }).catch(err => console.error("Failed to persist node position:", err));
    }, []);

    const { user } = useAuth();
    const isAnalyst = user?.role === 'ANALYST';

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} className={clsx(selectedNode && 'focus-mode')}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={isAnalyst ? undefined : onNodesChange}
                onEdgesChange={isAnalyst ? undefined : onEdgesChange}
                onConnect={isAnalyst ? undefined : onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onNodeDragStop={isAnalyst ? undefined : onNodeDragStop}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[20, 20]}
                colorMode="dark"
                nodesDraggable={!isAnalyst}
                nodesConnectable={!isAnalyst}
                elementsSelectable={true}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="#27272a"
                />
                <Controls style={{ fill: '#e4e4e7', backgroundColor: '#18181b', borderColor: '#27272a' }} />
                <MiniMap
                    nodeColor="#27272a"
                    maskColor="rgba(9, 9, 11, 0.8)"
                    // @ts-ignore
                    style={{ backgroundColor: '#101012', border: '1px solid #27272a' }}
                />
            </ReactFlow>
            <CanvasToolbar
                onAddNode={() => setIsAddModalOpen(true)}
                onManageTeam={() => setIsTeamModalOpen(true)}
            />
            <InspectorPanel
                isOpen={!!selectedNode}
                onClose={() => setSelectedNode(null)}
                data={selectedNode}
                onDataDelete={async (item) => {
                    if (!confirm('Are you sure you want to delete this?')) return;
                    try {
                        const endpoint = item.type === 'edge' ? `/edges/${item.id}` : `/nodes/${item.id}`;
                        await apiClient.delete(endpoint);
                        setSelectedNode(null);
                        fetchData(); // Refresh graph
                    } catch (e) {
                        console.error('Delete failed', e);
                        alert('Failed to delete item.');
                    }
                }}
            />
            {caseId && (
                <AddEntityModal
                    isOpen={isAddModalOpen}
                    caseId={caseId}
                    onClose={() => setIsAddModalOpen(false)}
                    onEntityCreated={fetchData}
                />
            )}
            {caseId && isTeamModalOpen && (
                <TeamManager
                    caseId={caseId}
                    onClose={() => setIsTeamModalOpen(false)}
                />
            )}
        </div>
    );
}
