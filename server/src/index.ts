import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key'; // In prod use env

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- ROUTES ---
import path from 'path';

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../dist')));
}

// Health Check

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: 'v5-stable' });
});

// --- RBAC MIDDLEWARE & SEEDING ---

// Middleware to simulate getting user from header
const getAuthUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
        // Default to Analyst for demo purposes if no header
        // In real app: return res.status(401).json({ error: 'Unauthorized' });
        // checking if we have any users, if not, create default
        try {
            const count = await prisma.user.count();
            if (count === 0) await seedUsers();
        } catch (e) { }
    }
    next();
};

// --- SEEDING & UTILS ---

const seedUsers = async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
        { name: 'Director Vance', email: 'vance@ncis.gov', password: hashedPassword, role: 'OWNER', isVerified: true },
        { name: 'Special Agent Gibbs', email: 'gibbs@ncis.gov', password: hashedPassword, role: 'INVESTIGATOR', isVerified: true },
        { name: 'Analyst McGee', email: 'mcgee@ncis.gov', password: hashedPassword, role: 'ANALYST', isVerified: true }
    ];

    console.log('Checking for existing users...');
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        console.log('Users already exist. Skipping seed.');
        return;
    }

    for (const u of users) {
        await prisma.user.create({ data: u });
    }
    console.log('Seeded Users with Auth');
};

// Middleware Factory
const authorize = (roles: string[]) => {
    return async (req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            // Attempt auto-seed if empty database is hit on first request (optional dev convenience)
            try {
                await seedUsers();
            } catch (e) { }
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (roles.length > 0 && !roles.includes(user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    };
};

// ... seedUsers (unchanged) ...

// --- AUTH ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(400).json({ error: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // First user is OWNER, others are INVESTIGATORS by default (can be inviting later)
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? 'OWNER' : 'INVESTIGATOR';

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                isVerified: true // Direct verification
            }
        });

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (e: any) {
        console.error('[SIGNUP ERROR]', e);
        res.status(500).json({ error: e.message || 'Signup failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (e) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/users', authorize([]), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});


// Users Endpoint for Frontend Switcher
app.get('/api/users', async (req, res) => {
    try {
        let users = await prisma.user.findMany();
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

// app.use(getAuthUser); // Legacy middleware removed

// 1. CASES
app.get('/api/cases', authorize([]), async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const cases = await prisma.case.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId: userId } } }
                ]
            },
            orderBy: { updatedAt: 'desc' },
            include: { nodes: true, edges: true, hypotheses: true, auditLogs: true }
        });
        res.json(cases);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch cases' });
    }
});

app.post('/api/cases', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { title, status, lead, summary } = req.body;
        const newCase = await prisma.case.create({
            data: {
                title, status, lead, summary,
                ownerId: req.user.id
            }
        });
        await prisma.auditLog.create({
            data: {
                caseId: newCase.id,
                action: 'CREATE_CASE',
                details: `Case created: ${title}`,
                user: req.user.name,
                userId: req.user.id
            }
        });
        res.json(newCase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create case' });
    }
});

app.get('/api/cases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const caseData = await prisma.case.findUnique({
            where: { id },
            include: { nodes: true, edges: true, hypotheses: true, auditLogs: true }
        });
        if (!caseData) return res.status(404).json({ error: 'Case not found' });
        res.json(caseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch case details' });
    }
});

// Case Members - Maintained below under Member Management

// 2. NODES
app.get('/api/nodes', async (req, res) => {
    try {
        const { type, caseId } = req.query;
        const where: any = {};
        if (type) where.type = String(type);
        if (caseId) where.caseId = String(caseId);

        const nodes = await prisma.node.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { case: { select: { title: true } } }
        });
        res.json(nodes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch nodes' });
    }
});

app.post('/api/nodes', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { caseId, type, label, detail, x, y, data } = req.body;
        const node = await prisma.node.create({
            data: { caseId, type, label, detail, x, y, data }
        });
        await prisma.auditLog.create({
            data: {
                caseId,
                action: 'ADD_ENTITY',
                details: `Added ${type}: ${label}`,
                user: req.user.name,
                userId: req.user.id
            }
        });
        res.json(node);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create node' });
    }
});

app.put('/api/nodes/:id/position', async (req, res) => {
    try {
        const { id } = req.params;
        const { x, y } = req.body;
        const node = await prisma.node.update({
            where: { id },
            data: { x, y }
        });
        res.json(node);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to move node' });
    }
});

app.put('/api/nodes/:id', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { detail, label } = req.body;
        const node = await prisma.node.update({
            where: { id },
            data: { detail, label }
        });
        await prisma.auditLog.create({
            data: {
                caseId: node.caseId,
                action: 'UPDATE_ENTITY',
                details: `Updated entity: ${label}`,
                user: req.user.name,
                userId: req.user.id
            }
        });
        res.json(node);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update node' });
    }
});

// 3. EDGES
app.delete('/api/nodes/:id', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const node = await prisma.node.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                caseId: node.caseId,
                action: 'DELETE_ENTITY',
                details: `Deleted entity: ${node.label} (${node.type})`,
                user: req.user.name,
                userId: req.user.id
            }
        });
        res.json({ success: true, id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete node' });
    }
});

app.delete('/api/edges/:id', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const edge = await prisma.edge.delete({ where: { id } });
        res.json({ success: true, id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete edge' });
    }
});

app.post('/api/edges', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { caseId, sourceId, targetId, label } = req.body;
        const edge = await prisma.edge.create({
            data: { caseId, sourceId, targetId, label }
        });
        await prisma.auditLog.create({
            data: {
                caseId,
                action: 'CONNECT_ENTITIES',
                details: `Connected nodes: ${label}`,
                user: req.user.name,
                userId: req.user.id
            }
        });
        res.json(edge);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to connect nodes' });
    }
});

app.put('/api/edges/:id', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { label } = req.body;
        const edge = await prisma.edge.update({
            where: { id },
            data: { label }
        });
        await prisma.auditLog.create({
            data: {
                caseId: edge.caseId,
                action: 'UPDATE_EDGE',
                details: `Renamed connection to: ${label}`,
                user: req.user.name,
                userId: req.user.id
            }
        });
        res.json(edge);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update edge' });
    }
});

// 4. HYPOTHESES
app.get('/api/hypotheses', async (req, res) => {
    try {
        const { caseId } = req.query;
        const where = caseId ? { caseId: String(caseId) } : {};
        const items = await prisma.hypothesis.findMany({ where, orderBy: { createdAt: 'desc' } });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch hypotheses' });
    }
});

app.post('/api/hypotheses', async (req, res) => {
    try {
        const { caseId, title, status, desc } = req.body;
        const item = await prisma.hypothesis.create({
            data: { caseId, title, status, desc }
        });
        // Auto-audit
        await prisma.auditLog.create({
            data: {
                caseId,
                action: 'CREATE_HYPOTHESIS',
                details: `Created hypothesis: ${title}`
            }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.put('/api/hypotheses/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const item = await prisma.hypothesis.update({
            where: { id },
            data: { status }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// 5. EVIDENCE VAULT
app.get('/api/evidence', async (req, res) => {
    try {
        const { caseId } = req.query;
        // if (!caseId) return res.status(400).json({ error: 'Case ID required' }); // Allow global view
        const where = caseId ? { caseId: String(caseId) } : {};
        const items = await prisma.evidence.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch evidence' });
    }
});

app.post('/api/evidence', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { caseId, label, type, hash, url } = req.body;
        const item = await prisma.evidence.create({
            data: { caseId, label, type, hash, url }
        });
        await prisma.auditLog.create({
            data: {
                caseId,
                action: 'UPLOAD_EVIDENCE',
                details: `Uploaded evidence: ${label}`,
                user: req.user.name,
                userId: req.user.id
            }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed' });
    }
});

app.delete('/api/evidence/:id', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { id } = req.params;
        await prisma.evidence.delete({ where: { id } });
        await prisma.auditLog.create({
            data: {
                caseId: req.body.caseId, // Might be null if not passed, but that's ok
                action: 'DELETE_EVIDENCE',
                details: `Deleted evidence ID: ${id}`,
                user: req.user.name,
                userId: req.user.id
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// 6. AUDIT LOGS
app.get('/api/audit-logs', async (req, res) => {
    try {
        const { caseId } = req.query;
        const where = caseId ? { caseId: String(caseId) } : {};
        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            include: { case: { select: { title: true } } }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Catch-all for React Router (must be last)
if (process.env.NODE_ENV === 'production') {
    app.get(/[\s\S]*/, (req, res) => {
        res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });
}

// Start
// --- MEMBER MANAGEMENT ---

app.get('/api/cases/:id/members', authorize([]), async (req, res) => {
    try {
        const members = await prisma.caseMember.findMany({
            where: { caseId: req.params.id },
            include: { user: { select: { id: true, name: true } } }
        });
        res.json(members);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

app.post('/api/cases/:id/members', authorize(['OWNER', 'INVESTIGATOR']), async (req, res) => {
    try {
        const { userId, role } = req.body;
        // Check if current user has rights to invite? (Owner/Investigator check already in authorize)
        // Ideally check if user is actually a member of THIS case if strict permissions needed.
        // For now, allow any Investigator/Owner to build teams.

        const newMember = await prisma.caseMember.create({
            data: {
                caseId: req.params.id,
                userId,
                role
            }
        });
        res.json(newMember);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

app.listen(PORT, () => {
    console.log(`Forensic Core running on port ${PORT}`);
});
