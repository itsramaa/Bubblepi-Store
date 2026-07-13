'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, Check } from 'lucide-react';

interface CredentialDisplayProps {
  credential: string;
  label?: string;
}

export function CredentialDisplay({ credential, label = 'Akun' }: CredentialDisplayProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const masked = credential.replace(/./g, '•');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(credential);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = credential;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code
          className={`flex-1 rounded bg-muted px-3 py-2 font-mono text-sm transition-all duration-300 ${
            revealed ? 'blur-none' : 'blur-sm'
          }`}
        >
          {revealed ? credential : masked}
        </code>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRevealed(!revealed)}
          title={revealed ? 'Sembunyikan' : 'Tampilkan'}
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCopy} title="Salin">
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
