import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signup(name, email, password);
            navigate(`/verify?email=${encodeURIComponent(email)}`);
        } catch (err) {
            setError('Failed to create account. Email may be taken.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <Shield size={48} color="#3b82f6" />
                    <h1 style={styles.title}>NEW AGENT REGISTRATION</h1>
                    <p style={styles.subtitle}>Forensic Core Clearance</p>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && <div style={styles.error}>{error}</div>}

                    <div style={styles.group}>
                        <label style={styles.label}>Full Legal Name</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Email Identification</label>
                        <input
                            type="email"
                            style={styles.input}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="agent@agency.gov"
                            required
                        />
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Secure Code (Password)</label>
                        <input
                            type="password"
                            style={styles.input}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Processing...' : 'Submit Credentials'}
                    </button>

                    <div style={styles.footer}>
                        <Link to="/login" style={styles.link}>Return to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#09090b',
        backgroundImage: 'radial-gradient(circle at 50% 50%, #1c1c20 0%, #09090b 100%)',
    },
    card: {
        width: '400px',
        padding: '40px',
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        border: '1px solid #27272a',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '32px',
    },
    title: {
        fontSize: '1.2rem',
        fontWeight: 700,
        color: '#e4e4e7',
        marginTop: '16px',
        marginBottom: '4px',
        letterSpacing: '-0.02em',
        textAlign: 'center',
    },
    subtitle: {
        color: '#71717a',
        fontSize: '0.875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        color: '#a1a1aa',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 600,
    },
    input: {
        padding: '12px',
        backgroundColor: '#27272a',
        border: '1px solid #3f3f46',
        borderRadius: '6px',
        color: '#f4f4f5',
        fontSize: '0.95rem',
        outline: 'none',
    },
    button: {
        marginTop: '8px',
        padding: '12px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.95rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    buttonDisabled: {
        opacity: 0.7,
        cursor: 'not-allowed',
    },
    footer: {
        marginTop: '16px',
        textAlign: 'center',
    },
    link: {
        color: '#3b82f6',
        fontSize: '0.875rem',
        textDecoration: 'none',
    },
    error: {
        padding: '10px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#ef4444',
        borderRadius: '6px',
        fontSize: '0.875rem',
        textAlign: 'center',
    }
};
