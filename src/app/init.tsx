'use client';

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Full Signet secure interface — all methods Signet may provide
interface SecureInterface {
    getProfileDid(): Promise<string>;
    getParameters(): Promise<Record<string, unknown>>;
    getWalletAccess(): Promise<string>;
    signMessage(message: string): Promise<string>;
    requestPermissions(permissions: string[]): Promise<Array<{ type: string; granted: boolean }>>;
    getPermissions(): Array<{ type: string; granted: boolean }>;
    getSessionId(): string;
    validateSession(): Promise<boolean>;
}

// ─── App component ────────────────────────────────────────────────────────────

function App({
    secureInterface,
    params,
}: {
    secureInterface: SecureInterface | null;
    params: Record<string, unknown>;
}) {
    const [did, setDid] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (!secureInterface) return;
        secureInterface.getProfileDid().then(setDid).catch(console.error);
    }, [secureInterface]);

    const requestWallet = async () => {
        if (!secureInterface) return;
        try {
            setStatus('Requesting permission…');
            await secureInterface.requestPermissions(['wallet:access']);
            const address = await secureInterface.getWalletAccess();
            setWalletAddress(address);
            setStatus('');
        } catch {
            setStatus('Wallet access was denied.');
        }
    };

    const style = {
        root: {
            backgroundColor: '#1e1e2e',
            color: '#cdd6f4',
            padding: '24px',
            fontFamily: 'system-ui, sans-serif',
            minHeight: '100%',
            boxSizing: 'border-box' as const,
        },
        h1: { marginTop: 0, color: '#cba6f7' },
        h3: { color: '#89b4fa', marginBottom: '6px', marginTop: '20px' },
        pre: {
            background: '#313244',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '12px',
            margin: 0,
            overflowX: 'auto' as const,
        },
        btn: {
            background: '#cba6f7',
            color: '#1e1e2e',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold' as const,
        },
        muted: { color: '#6c7086', marginTop: '8px' },
    };

    return (
        <div style={style.root}>
            <h1 style={style.h1}>Signet DApp Starter</h1>

            {secureInterface ? (
                <>
                    <section>
                        <h3 style={style.h3}>Profile</h3>
                        <p style={{ margin: 0 }}>
                            <strong>DID:</strong> {did ?? 'Loading…'}
                        </p>
                    </section>

                    {Object.keys(params).length > 0 && (
                        <section>
                            <h3 style={style.h3}>Parameters</h3>
                            <pre style={style.pre}>{JSON.stringify(params, null, 2)}</pre>
                        </section>
                    )}

                    <section>
                        <h3 style={style.h3}>Wallet</h3>
                        {walletAddress ? (
                            <p style={{ margin: 0 }}>
                                <strong>Address:</strong> {walletAddress}
                            </p>
                        ) : (
                            <button style={style.btn} onClick={requestWallet}>
                                Request Wallet Access
                            </button>
                        )}
                        {status && <p style={style.muted}>{status}</p>}
                    </section>
                </>
            ) : (
                <p style={style.muted}>No security interface — running outside Signet.</p>
            )}
        </div>
    );
}

// ─── init ─────────────────────────────────────────────────────────────────────
// Called by Signet with the container element and the secure interface.
// Returns a cleanup function that Signet calls when the DApp is closed.

export function init(container: HTMLElement, secureInterface: SecureInterface | null) {
    const root = createRoot(container);

    const render = (params: Record<string, unknown>) => {
        root.render(
            <React.StrictMode>
                <App secureInterface={secureInterface} params={params} />
            </React.StrictMode>
        );
    };

    // Fetch runtime parameters before rendering; fall back to empty object on error
    if (secureInterface?.getParameters) {
        secureInterface.getParameters().then(render).catch(() => render({}));
    } else {
        render({});
    }

    return () => root.unmount();
}

// Expose globally so Signet can find the DApp via globalExport: "DApp" in manifest.json
if (typeof window !== 'undefined') {
    (window as unknown as { DApp: { init: typeof init } }).DApp = { init };
}
