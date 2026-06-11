'use client';

import React, { useEffect, useRef } from 'react';
import DAppExport from './components/DAppExport';
import { init } from './init';

// Mock implementation of the full Signet secure interface for local development
type MockSecureInterface = {
    getProfileDid(): Promise<string>;
    getParameters(): Promise<Record<string, unknown>>;
    getWalletAccess(): Promise<string>;
    signMessage(message: string): Promise<string>;
    requestPermissions(permissions: string[]): Promise<Array<{ type: string; granted: boolean }>>;
    getPermissions(): Array<{ type: string; granted: boolean }>;
    getSessionId(): string;
    validateSession(): Promise<boolean>;
};

// For Next.js rendering (local dev only — not part of the DApp bundle)
export default function Home() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Ensure init is reachable in the bundle
        if (typeof window !== 'undefined') {
            (window as unknown as { bundledInit: typeof init }).bundledInit = init;
        }
    }, []);

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' && containerRef.current) {
            const params = new URLSearchParams(window.location.search);
            const mockParam = params.get('mock');
            const useMock = mockParam === null ? true : mockParam === '1';

            let secureInterface: MockSecureInterface | null = null;

            if (useMock) {
                // Granted permissions accumulate as requestPermissions is called
                const grantedPermissions: Array<{ type: string; granted: boolean }> = [
                    { type: 'profile:read', granted: true },
                    { type: 'dapp:communicate', granted: true },
                ];

                secureInterface = {
                    async getProfileDid() {
                        await new Promise((r) => setTimeout(r, 200));
                        return 'did:signet:local-dev-1234567890';
                    },
                    async getParameters() {
                        await new Promise((r) => setTimeout(r, 50));
                        return { apiBaseUrl: 'http://localhost:3001', env: 'dev' };
                    },
                    async getWalletAccess() {
                        const perm = grantedPermissions.find((p) => p.type === 'wallet:access');
                        if (!perm?.granted) throw new Error('Permission denied: wallet:access');
                        await new Promise((r) => setTimeout(r, 100));
                        return '0xMockWalletAddress1234567890abcdef';
                    },
                    async signMessage(message: string) {
                        const perm = grantedPermissions.find((p) => p.type === 'wallet:sign');
                        if (!perm?.granted) throw new Error('Permission denied: wallet:sign');
                        await new Promise((r) => setTimeout(r, 300));
                        return '0xMockSignature_' + btoa(message).substring(0, 20);
                    },
                    async requestPermissions(permissions: string[]) {
                        await new Promise((r) => setTimeout(r, 100));
                        const results = permissions.map((type) => {
                            const existing = grantedPermissions.find((p) => p.type === type);
                            if (!existing) {
                                const result = { type, granted: true };
                                grantedPermissions.push(result);
                                return result;
                            }
                            return existing;
                        });
                        return results;
                    },
                    getPermissions() {
                        return [...grantedPermissions];
                    },
                    getSessionId() {
                        return 'mock-session-local-dev-001';
                    },
                    async validateSession() {
                        return true;
                    },
                };
                console.log('page.tsx: using mock secureInterface for local dev');
            } else {
                console.log('page.tsx: mock disabled (?mock=0) — running without secureInterface');
            }

            const cleanup = init(containerRef.current, secureInterface);

            return () => {
                try {
                    cleanup?.();
                } catch (e) {
                    console.log('page.tsx: cleanup threw', e);
                }
            };
        }
    }, []);

    return (
        <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <h2>Signet DApp Starter — Local Dev</h2>
            <p>
                The DApp renders in the container below using a mock Signet security interface.
                <br />
                Append <code>?mock=0</code> to disable the mock; <code>?mock=1</code> (default) to enable it.
            </p>
            {/* Include DAppExport to ensure init is bundled by Next.js */}
            <DAppExport />
            {/* Mock Signet container */}
            <div
                id="test-container"
                ref={containerRef}
                style={{
                    width: '100%',
                    minHeight: '300px',
                    height: '60vh',
                    border: '1px dashed #999',
                    marginTop: '16px',
                    position: 'relative',
                    overflow: 'auto',
                }}
            />
        </div>
    );
}
