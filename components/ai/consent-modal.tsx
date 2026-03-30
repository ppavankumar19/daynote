'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePreferencesStore } from '@/stores/preferences.store';

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export function ConsentModal({ open, onAccept, onCancel }: ConsentModalProps) {
  const endpoint = usePreferencesStore((s) => s.preferences.aiEndpoint);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent
        // Prevent dismissal via outside click or Escape to ensure explicit consent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Before enabling the AI assistant</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                The AI assistant will send <strong>excerpts</strong> of your notes (not your full
                note history) to the API endpoint you have configured:
              </p>
              {endpoint && (
                <code className="block rounded bg-muted px-3 py-2 text-xs">{endpoint}</code>
              )}
              <p>
                Your API key is stored only in your browser&apos;s local storage and is{' '}
                <strong>never sent to DayNote&apos;s servers</strong>.
              </p>
              <p>
                For maximum privacy, point the endpoint at a local Ollama instance — no data will
                leave your machine.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onAccept}>I understand, enable AI</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
