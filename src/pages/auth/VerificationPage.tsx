import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock } from 'lucide-react';

export default function VerificationPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const { verify } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');

    useEffect(() => {
        if (!email) navigate('/login');
    }, [email, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (email) {
                await verify(email, code);
                navigate('/login');
            }
        } catch (err) {
            setError('Invalid verification code.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <Lock size={48} color="#eab308" />
                    <h1 style={styles.title}>IDENTITY VERIFICATION</h1>
                    <p style={styles.subtitle}>Check External Console/Email</p>
                </div>

                <div style={styles.info}>
                    A simulated verification code has been sent to <strong>{email}</strong>.
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && <div style={styles.error}>{error}</div>}

                    <div style={styles.group}>
                        <label style={styles.label}>6-Digit PIN</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>

                    <button type="submit" style={styles.button}>Verify Identity</button>
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
        marginBottom: '24px',
    },
    title: {
        fontSize: '1.2rem',
        fontWeight: 700,
        color: '#e4e4e7',
        marginTop: '16px',
        marginBottom: '4px',
        letterSpacing: '-0.02em',
    },
    subtitle: {
        color: '#71717a',
        fontSize: '0.875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
    },
    info: {
        color: '#a1a1aa',
        fontSize: '0.9rem',
        textAlign: 'center',
        marginBottom: '24px',
        lineHeight: '1.4',
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
        fontSize: '1.5rem',
        textAlign: 'center',
        letterSpacing: '0.5em',
        outline: 'none',
        fontFamily: 'monospace',
    },
    button: {
        marginTop: '8px',
        padding: '12px',
        backgroundColor: '#eab308',
        color: '#000',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.95rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'background 0.2s',
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
