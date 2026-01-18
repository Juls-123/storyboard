import { useCallback, useState, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
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
import EntityTooltip from './EntityTooltip';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const nodeTypes = {
    entity: EntityNode as any,
};

export default function StoryCanvas() {
    const [searchParams] = useSearchParams();
    const caseId = searchParams.get('caseId'); // Fixed param name to match Dashboard

    const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [tooltipNode, setTooltipNode] = useState<any>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
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

    const [caseTitle, setCaseTitle] = useState('');

    // Fetch Graph Data
    const fetchData = useCallback(async () => {
        if (!caseId) return;
        try {
            const data = await apiClient.get(`/cases/${caseId}`);
            if (data.title) {
                setCaseTitle(data.title);
            }
            if (data.nodes) {
                setNodes(data.nodes.map((n: any) => {
                    let parsedMeta = {};
                    try {
                        parsedMeta = n.data ? JSON.parse(n.data) : {};
                    } catch (e) {
                        console.error('Failed to parse node data for node:', n.id, e);
                        parsedMeta = {};
                    }
                    return {
                        id: n.id,
                        type: 'entity',
                        position: { x: n.x, y: n.y },
                        data: {
                            id: n.id,
                            label: n.label || 'Unnamed',
                            type: n.type || 'unknown',
                            detail: n.detail || '',
                            id_short: n.id.substring(0, 8),
                            meta: parsedMeta,
                            ...parsedMeta // Spread to make profilePicture accessible at top level
                        }
                    };
                }));
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
        async (connection: any) => {
            console.log('onConnect called with:', connection);
            console.log('caseId:', caseId);

            if (!caseId) {
                console.error('No caseId available');
                return;
            }

            // Persist to backend first
            try {
                console.log('Sending edge creation request...');
                const savedEdge = await apiClient.post('/edges', {
                    sourceId: connection.source,
                    targetId: connection.target,
                    caseId,
                    label: 'RELATED_TO'
                });

                console.log('Edge saved successfully:', savedEdge);

                // Add edge to UI with the real ID from database
                const newEdge = {
                    id: savedEdge.id,
                    source: connection.source,
                    target: connection.target,
                    label: savedEdge.label || 'RELATED_TO',
                    style: { stroke: '#4a5059', strokeWidth: 1 }
                };

                setEdges((eds) => [...eds, newEdge]);
            } catch (err: any) {
                console.error('Failed to save edge:', err);
                const errorMessage = err.response?.data?.error || err.message;
                const errorDetails = err.response?.data?.details || '';
                alert(`Failed to create connection:\n${errorMessage}\n${errorDetails}`);
            }
        },
        [setEdges, caseId],
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        // Calculate position for tooltip (offset from node)
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setTooltipPosition({
            x: rect.right + 10, // 10px to the right of the node
            y: rect.top
        });
        setTooltipNode(node.data);
    }, []);

    const onEdgeClick = useCallback((_: React.MouseEvent, edge: any) => {
        setSelectedNode({
            id: edge.id,
            type: 'edge',
            label: edge.label || 'RELATED_TO',
            detail: `Source: ${edge.source}\nTarget: ${edge.target}`
        });
        setTooltipNode(null);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setTooltipNode(null);
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

    const [filterState, setFilterState] = useState({
        showEvidence: true,
        showEntities: true
    });

    const filteredNodes = nodes.filter(n => {
        if (n.data?.type === 'evidence' && !filterState.showEvidence) return false;
        if (n.data?.type !== 'evidence' && !filterState.showEntities) return false;
        return true;
    });

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} className={clsx(selectedNode && 'focus-mode')}>
            <ReactFlow
                nodes={filteredNodes}
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

            {/* Case Title Header */}
            <div style={{
                position: 'absolute',
                top: 24,
                left: 24,
                padding: '8px 16px',
                background: 'rgba(24, 24, 27, 0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#e4e4e7',
                fontSize: '14px',
                fontWeight: 500,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'none' // Click through to canvas
            }}>
                <span style={{ color: '#71717a' }}>OPERATION:</span>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {caseTitle || 'Loading...'}
                </span>
            </div>

            <CanvasToolbar
                onAddNode={() => setIsAddModalOpen(true)}
                onManageTeam={() => setIsTeamModalOpen(true)}
                onToggleFocus={toggleFullscreen}
                filterState={filterState}
                onFilterChange={(key) => setFilterState(prev => ({ ...prev, [key]: !prev[key] }))}
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

            {tooltipNode && (
                <EntityTooltip
                    node={tooltipNode}
                    position={tooltipPosition}
                    onClose={() => setTooltipNode(null)}
                    onEdit={() => {
                        setSelectedNode(tooltipNode);
                        setTooltipNode(null);
                    }}
                />
            )}
        </div>
    );
}
