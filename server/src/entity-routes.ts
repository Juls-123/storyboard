import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// ENTITY MANAGEMENT
// ============================================

// Create global entity
router.post('/entities', async (req: any, res: any) => {
    try {
        const { type, primaryName, confidence, status } = req.body;

        const entity = await prisma.entity.create({
            data: {
                type,
                primaryName,
                confidence: confidence || 0.5,
                status: status || 'ACTIVE',
                createdById: req.user.id
            }
        });

        res.json(entity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create entity' });
    }
});

// Get full entity profile
router.get('/entities/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const entity = await prisma.entity.findUnique({
            where: { id },
            include: {
                attributes: {
                    where: { supersededBy: null }, // Only current versions
                    orderBy: { category: 'asc' }
                },
                notes: {
                    include: { author: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                relationships: {
                    include: {
                        target: { select: { id: true, primaryName: true, type: true } }
                    }
                },
                relatedFrom: {
                    include: {
                        source: { select: { id: true, primaryName: true, type: true } }
                    }
                },
                caseLinks: {
                    include: {
                        case: { select: { id: true, title: true } },
                        addedBy: { select: { name: true } }
                    }
                },
                createdBy: { select: { name: true } }
            }
        });

        if (!entity) {
            return res.status(404).json({ error: 'Entity not found' });
        }

        res.json(entity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch entity' });
    }
});

// Update core identity (restricted)
router.put('/entities/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { primaryName, confidence, status } = req.body;

        const entity = await prisma.entity.update({
            where: { id },
            data: {
                ...(primaryName && { primaryName }),
                ...(confidence !== undefined && { confidence }),
                ...(status && { status })
            }
        });

        res.json(entity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update entity' });
    }
});

// Search entities
router.get('/entities', async (req, res) => {
    try {
        const { q, type, caseId } = req.query;

        const where: any = {};

        if (q) {
            where.primaryName = { contains: String(q), mode: 'insensitive' };
        }

        if (type) {
            where.type = String(type);
        }

        if (caseId) {
            where.caseLinks = {
                some: { caseId: String(caseId) }
            };
        }

        const entities = await prisma.entity.findMany({
            where,
            take: 50,
            orderBy: { updatedAt: 'desc' },
            include: {
                createdBy: { select: { name: true } },
                caseLinks: { select: { caseId: true, role: true } }
            }
        });

        res.json(entities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to search entities' });
    }
});

// ============================================
// ATTRIBUTE MANAGEMENT
// ============================================

// Add attribute (fact)
router.post('/entities/:id/attributes', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { category, key, value, valueType, confidence, source } = req.body;

        const attribute = await prisma.entityAttribute.create({
            data: {
                entityId: id,
                category,
                key,
                value,
                valueType: valueType || 'text',
                confidence: confidence || 0.5,
                source,
                createdById: req.user.id
            }
        });

        res.json(attribute);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add attribute' });
    }
});

// Update attribute (creates new version)
router.put('/entities/:entityId/attributes/:attrId', async (req: any, res: any) => {
    try {
        const { entityId, attrId } = req.params;
        const { value, confidence, source } = req.body;

        // Get current attribute
        const current = await prisma.entityAttribute.findUnique({
            where: { id: attrId }
        });

        if (!current) {
            return res.status(404).json({ error: 'Attribute not found' });
        }

        // Create new version
        const newVersion = await prisma.entityAttribute.create({
            data: {
                entityId,
                category: current.category,
                key: current.key,
                value: value || current.value,
                valueType: current.valueType,
                confidence: confidence !== undefined ? confidence : current.confidence,
                source: source || current.source,
                createdById: req.user.id,
                supersededBy: null
            }
        });

        // Mark old version as superseded
        await prisma.entityAttribute.update({
            where: { id: attrId },
            data: { supersededBy: newVersion.id }
        });

        res.json(newVersion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update attribute' });
    }
});

// Deprecate attribute (soft delete)
router.delete('/entities/:entityId/attributes/:attrId', async (req, res) => {
    try {
        const { attrId } = req.params;

        // Mark as superseded without replacement (deprecation)
        await prisma.entityAttribute.update({
            where: { id: attrId },
            data: { supersededBy: 'DEPRECATED' }
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to deprecate attribute' });
    }
});

// ============================================
// NOTE MANAGEMENT
// ============================================

// Add intelligence note
router.post('/entities/:id/notes', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { content, category } = req.body;

        const note = await prisma.entityNote.create({
            data: {
                entityId: id,
                content,
                category,
                authorId: req.user.id
            },
            include: {
                author: { select: { name: true } }
            }
        });

        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add note' });
    }
});

// Get all notes for entity
router.get('/entities/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;

        const notes = await prisma.entityNote.findMany({
            where: { entityId: id },
            include: {
                author: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// ============================================
// RELATIONSHIP MANAGEMENT
// ============================================

// Create entity relationship
router.post('/relationships', async (req: any, res: any) => {
    try {
        const { sourceId, targetId, relationshipType, direction, confidence, status, validFrom, validTo } = req.body;

        const relationship = await prisma.entityRelationship.create({
            data: {
                sourceId,
                targetId,
                relationshipType,
                direction: direction || 'BIDIRECTIONAL',
                confidence: confidence || 0.5,
                status: status || 'ASSUMED',
                validFrom,
                validTo,
                createdById: req.user.id
            },
            include: {
                source: { select: { id: true, primaryName: true, type: true } },
                target: { select: { id: true, primaryName: true, type: true } }
            }
        });

        res.json(relationship);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create relationship' });
    }
});

// Get all relationships for entity
router.get('/entities/:id/relationships', async (req, res) => {
    try {
        const { id } = req.params;

        const [outgoing, incoming] = await Promise.all([
            prisma.entityRelationship.findMany({
                where: { sourceId: id },
                include: {
                    target: { select: { id: true, primaryName: true, type: true } }
                }
            }),
            prisma.entityRelationship.findMany({
                where: { targetId: id },
                include: {
                    source: { select: { id: true, primaryName: true, type: true } }
                }
            })
        ]);

        res.json({ outgoing, incoming });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch relationships' });
    }
});

// Update relationship
router.put('/relationships/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { relationshipType, confidence, status, validFrom, validTo } = req.body;

        const relationship = await prisma.entityRelationship.update({
            where: { id },
            data: {
                ...(relationshipType && { relationshipType }),
                ...(confidence !== undefined && { confidence }),
                ...(status && { status }),
                ...(validFrom !== undefined && { validFrom }),
                ...(validTo !== undefined && { validTo })
            }
        });

        res.json(relationship);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update relationship' });
    }
});

// ============================================
// CASE INTEGRATION
// ============================================

// Link entity to case
router.post('/cases/:caseId/entities', async (req: any, res: any) => {
    try {
        const { caseId } = req.params;
        const { entityId, role, notes, visibility } = req.body;

        const link = await prisma.entityCaseLink.create({
            data: {
                entityId,
                caseId,
                role: role || 'UNKNOWN',
                notes,
                visibility: visibility || 'TEAM',
                addedById: req.user.id
            },
            include: {
                entity: { select: { id: true, primaryName: true, type: true } }
            }
        });

        res.json(link);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to link entity to case' });
    }
});

// Get all entities in case
router.get('/cases/:caseId/entities', async (req, res) => {
    try {
        const { caseId } = req.params;

        const links = await prisma.entityCaseLink.findMany({
            where: { caseId },
            include: {
                entity: {
                    include: {
                        attributes: {
                            where: { supersededBy: null },
                            take: 5
                        }
                    }
                },
                addedBy: { select: { name: true } }
            }
        });

        res.json(links);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch case entities' });
    }
});

// Update case-specific context
router.put('/cases/:caseId/entities/:entityId', async (req, res) => {
    try {
        const { caseId, entityId } = req.params;
        const { role, notes, visibility } = req.body;

        const link = await prisma.entityCaseLink.updateMany({
            where: { caseId, entityId },
            data: {
                ...(role && { role }),
                ...(notes !== undefined && { notes }),
                ...(visibility && { visibility })
            }
        });

        res.json({ success: true, updated: link.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update case context' });
    }
});

// ============================================
// EVIDENCE LINKING
// ============================================

// Link evidence to attribute/note/relationship
router.post('/evidence-links', async (req, res) => {
    try {
        const { evidenceId, attributeId, noteId, relationshipId } = req.body;

        if (!evidenceId || (!attributeId && !noteId && !relationshipId)) {
            return res.status(400).json({ error: 'Invalid evidence link data' });
        }

        const link = await prisma.evidenceLink.create({
            data: {
                evidenceId,
                ...(attributeId && { attributeId }),
                ...(noteId && { noteId }),
                ...(relationshipId && { relationshipId })
            }
        });

        res.json(link);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create evidence link' });
    }
});

// ============================================
// STORY NODE MANAGEMENT (Visual Placement)
// ============================================

// Create StoryNode (place entity on wall)
router.post('/story-nodes', async (req: any, res: any) => {
    try {
        const { entityId, caseId, x, y } = req.body;

        // Check if node already exists for this entity in this case
        const existing = await prisma.storyNode.findFirst({
            where: { entityId, caseId }
        });

        if (existing) {
            // Update position instead
            const updated = await prisma.storyNode.update({
                where: { id: existing.id },
                data: { x, y }
            });
            return res.json(updated);
        }

        // Create new StoryNode
        const node = await prisma.storyNode.create({
            data: {
                entityId,
                caseId,
                x,
                y
            },
            include: {
                entity: {
                    select: {
                        id: true,
                        type: true,
                        primaryName: true,
                        confidence: true,
                        status: true
                    }
                }
            }
        });

        res.json(node);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create story node' });
    }
});

// Get all StoryNodes for a case
router.get('/story-nodes', async (req, res) => {
    try {
        const { caseId } = req.query;

        if (!caseId) {
            return res.status(400).json({ error: 'caseId is required' });
        }

        const nodes = await prisma.storyNode.findMany({
            where: { caseId: String(caseId) },
            include: {
                entity: {
                    select: {
                        id: true,
                        type: true,
                        primaryName: true,
                        confidence: true,
                        status: true
                    }
                }
            }
        });

        res.json(nodes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch story nodes' });
    }
});

// Update StoryNode position
router.put('/story-nodes/:id/position', async (req, res) => {
    try {
        const { id } = req.params;
        const { x, y } = req.body;

        const node = await prisma.storyNode.update({
            where: { id },
            data: { x, y }
        });

        res.json(node);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update position' });
    }
});

// Delete StoryNode (remove from wall, not entity)
router.delete('/story-nodes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.storyNode.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete story node' });
    }
});

export default router;
