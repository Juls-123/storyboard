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
app.use(express.json());

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

// Middleware Factory
const authorize = (roles: string[]) => {
    return async (req: any, res: any, next: any) => {
        const userId = req.headers['x-user-id'] as string;
        console.log(`[AUTH] Checking UserID: ${userId} against Roles: ${roles}`);

        if (!userId) {
            console.log('[AUTH] No User ID');
            return res.status(401).json({ error: 'No user ID provided' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.log('[AUTH] User Not Found in DB');
            return res.status(401).json({ error: 'User not found' });
        }

        console.log(`[AUTH] User: ${user.name}, Role: ${user.role}`);

        if (!roles.includes(user.role)) {
            console.log('[AUTH] Insufficient Permissions');
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        req.user = user; // Attach user to request
        next();
    };
};

const seedUsers = async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
        { name: 'Director Vance', email: 'vance@ncis.gov', password: hashedPassword, role: 'OWNER', isVerified: true },
        { name: 'Special Agent Gibbs', email: 'gibbs@ncis.gov', password: hashedPassword, role: 'INVESTIGATOR', isVerified: true },
        { name: 'Analyst McGee', email: 'mcgee@ncis.gov', password: hashedPassword, role: 'ANALYST', isVerified: true }
    ];
    for (const u of users) {
        await prisma.user.create({ data: u });
    }
    console.log('Seeded Users with Auth');
};

// --- AUTH ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(400).json({ error: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'ANALYST', // Default role
                verificationCode: code
            }
        });

        console.log(`[SIMULATION] Verification Code for ${email}: ${code}`);

        res.json({ message: 'Signup successful. Please verify.', userId: user.id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Signup failed' });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'Already verified' });
        if (user.verificationCode !== code) return res.status(400).json({ error: 'Invalid code' });

        await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verificationCode: null }
        });

        res.json({ message: 'Verified successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[LOGIN ATTEMPT] Email: ${email}, Password: ${password}`); // CAREFUL: Don't log passwords in prod

        const user = await prisma.user.findUnique({ where: { email } });
        console.log(`[LOGIN] User Found: ${!!user}`);

        if (!user) return res.status(400).json({ error: 'Invalid credentials (User not found)' });

        const validPass = await bcrypt.compare(password, user.password);
        console.log(`[LOGIN] Password Valid: ${validPass}`);

        if (!validPass) return res.status(400).json({ error: 'Invalid credentials (Password mismatch)' });

        console.log(`[LOGIN] Verified: ${user.isVerified}`);
        if (!user.isVerified) return res.status(403).json({ error: 'Account not verified' });

        res.json({
            user: { id: user.id, name: user.name, role: user.role, email: user.email },
            token: user.id
        });
    } catch (e) {
        console.error('[LOGIN ERROR]', e);
        res.status(500).json({ error: 'Login failed internal error' });
    }
});

// Users Endpoint for Frontend Switcher
app.get('/api/users', async (req, res) => {
    try {
        let users = await prisma.user.findMany();
        if (users.length === 0) {
            await seedUsers();
            users = await prisma.user.findMany();
        }
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.use(getAuthUser);

// 1. CASES
app.get('/api/cases', async (req, res) => {
    try {
        const cases = await prisma.case.findMany({
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

// Case Members
app.post('/api/cases/:id/members', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.body;
        const actingUserId = req.headers['x-user-id'] as string;

        // 1. Check Authority (Must be Case Owner)
        const theCase = await prisma.case.findUnique({ where: { id } });
        if (!theCase) return res.status(404).json({ error: 'Case not found' });

        if (theCase.ownerId !== actingUserId) {
            const actingUser = await prisma.user.findUnique({ where: { id: actingUserId } });
            if (actingUser?.role !== 'OWNER') { // Global Owner override
                return res.status(403).json({ error: 'Only the Case Lead can manage the team' });
            }
        }

        // Check if already a member
        const existing = await prisma.caseMember.findUnique({
            where: {
                caseId_userId: { caseId: id, userId }
            }
        });

        if (existing) return res.status(400).json({ error: 'User is already a member' });

        const member = await prisma.caseMember.create({
            data: {
                caseId: id,
                userId,
                role
            },
            include: { user: true }
        });

        // Audit
        await prisma.auditLog.create({
            data: {
                caseId: id,
                action: 'ADD_MEMBER',
                details: `Added member: ${member.user.name} as ${role}`,
                user: actingUserId,
                userId: actingUserId
            }
        });

        res.json(member);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

app.get('/api/cases/:id/members', async (req, res) => {
    try {
        const { id } = req.params;
        const members = await prisma.caseMember.findMany({
            where: { caseId: id },
            include: { user: true }
        });
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

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
        const { caseId, type, label, detail, x, y } = req.body;
        const node = await prisma.node.create({
            data: { caseId, type, label, detail, x, y }
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
        if (!caseId) return res.status(400).json({ error: 'Case ID required' });
        const items = await prisma.evidence.findMany({
            where: { caseId: String(caseId) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch evidence' });
    }
});

app.post('/api/evidence', authorize(['OWNER', 'INVESTIGATOR']), async (req: any, res: any) => {
    try {
        const { caseId, label, type, hash } = req.body;
        const item = await prisma.evidence.create({
            data: { caseId, label, type, hash }
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
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });
}

// Start
app.listen(PORT, () => {
    console.log(`Forensic Core running on port ${PORT}`);
});
