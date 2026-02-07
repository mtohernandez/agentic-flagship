'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RiCloseLine, RiAddLine } from '@remixicon/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldError } from '@/components/ui/field';
import { SpinnerDotted } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { SCRAPE_ACTIONS } from '../model/types';
import type { ScrapeAction, ScrapeJob } from '../model/types';
import { buildPrompt } from '../model/build-prompt';
import { validateJobInput, canSubmit } from '../model/validation';

interface MissionFormProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  messageCount: number;
  onClear: () => void;
}

export function MissionForm({
  onSubmit,
  isLoading = false,
  messageCount,
  onClear,
}: MissionFormProps) {
  const [urlInput, setUrlInput] = useState('');
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [action, setAction] = useState<ScrapeAction>('extract-text');
  const [instructions, setInstructions] = useState('');
  const [urlError, setUrlError] = useState<string | undefined>();
  const [instructionsError, setInstructionsError] = useState<string | undefined>();

  const [pendingPrompts, setPendingPrompts] = useState<string[]>([]);
  const [totalQueued, setTotalQueued] = useState(0);

  const prevIsLoading = useRef(isLoading);

  const isProcessing = pendingPrompts.length > 0 || isLoading;

  const addJob = useCallback(() => {
    const result = validateJobInput(urlInput, action, instructions, jobs);
    if (!result.valid) {
      if (result.urlError) setUrlError(result.urlError);
      if (result.instructionsError) setInstructionsError(result.instructionsError);
      return;
    }
    setJobs((prev) => [
      ...prev,
      { url: urlInput.trim(), action, instructions: instructions.trim() },
    ]);
    setUrlInput('');
    setInstructions('');
    setUrlError(undefined);
    setInstructionsError(undefined);
  }, [urlInput, action, instructions, jobs]);

  const removeJob = useCallback((index: number) => {
    setJobs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (urlInput.trim()) {
        addJob();
      } else if (jobs.length > 0 && canSubmit(jobs)) {
        handleSubmit();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [urlInput, jobs, addJob]
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit(jobs) || isProcessing) return;

    const prompts = jobs.map((job) =>
      buildPrompt({ urls: [job.url], action: job.action, instructions: job.instructions })
    );

    onSubmit(prompts[0]);
    setPendingPrompts(prompts.slice(1));
    setTotalQueued(prompts.length);

    setJobs([]);
    setUrlInput('');
    setInstructions('');
    setUrlError(undefined);
    setInstructionsError(undefined);
  }, [jobs, isProcessing, onSubmit]);

  // Auto-fire next prompt when current mission completes
  useEffect(() => {
    const wasLoading = prevIsLoading.current;
    prevIsLoading.current = isLoading;

    if (wasLoading && !isLoading && pendingPrompts.length > 0) {
      onSubmit(pendingPrompts[0]);
      setPendingPrompts((prev) => prev.slice(1));
    }
  }, [isLoading, pendingPrompts, onSubmit]);

  const cancelQueue = useCallback(() => {
    setPendingPrompts([]);
    setTotalQueued(0);
  }, []);

  const hostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const actionLabel = (a: ScrapeAction) => {
    const opt = SCRAPE_ACTIONS.find((o) => o.value === a);
    return opt ? opt.label : a;
  };

  const currentActionOption = SCRAPE_ACTIONS.find((a) => a.value === action)!;
  const processedCount = totalQueued - pendingPrompts.length;

  return (
    <div className={cn('fixed bottom-4 left-0 right-0 px-4 z-10')}>
      <div className="relative max-w-2xl mx-auto pointer-events-auto">
        <div className="flex flex-col gap-2 rounded-xl border bg-background p-3 shadow-lg">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              Chat
              {messageCount > 0 && <Badge variant="secondary">{messageCount}</Badge>}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={messageCount === 0 || isProcessing}
              aria-label="Clear chat"
            >
              Clear
            </Button>
          </div>

          {/* Job badges */}
          {jobs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {jobs.map((job, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {hostname(job.url)} &middot; {actionLabel(job.action)}
                  <button
                    type="button"
                    onClick={() => removeJob(i)}
                    disabled={isProcessing}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 disabled:opacity-50"
                    aria-label={`Remove ${hostname(job.url)} ${actionLabel(job.action)}`}
                  >
                    <RiCloseLine className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex gap-2 items-start">
            <div className="flex-1 flex flex-col gap-1">
              <Input
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlError) setUrlError(undefined);
                }}
                onKeyDown={handleUrlKeyDown}
                placeholder="https://..."
                disabled={isProcessing}
                aria-label="URL input"
              />
              {urlError && <FieldError>{urlError}</FieldError>}
            </div>

            <Select
              value={action}
              onValueChange={(v) => setAction(v as ScrapeAction)}
              disabled={isProcessing}
            >
              <SelectTrigger className="w-48" aria-label="Scrape action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCRAPE_ACTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addJob}
              disabled={isProcessing || !urlInput.trim()}
              aria-label="Add Job"
            >
              <RiAddLine className="size-4" />
              Add Job
            </Button>
          </div>

          {/* Instructions textarea */}
          <div className="flex flex-col gap-1">
            <Textarea
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
                if (instructionsError) setInstructionsError(undefined);
              }}
              placeholder={currentActionOption.hint}
              rows={2}
              disabled={isProcessing}
              className="min-h-0 resize-none"
              aria-label="Additional instructions"
            />
            {instructionsError && <FieldError>{instructionsError}</FieldError>}
          </div>

          {/* Run button */}
          <Button
            type="button"
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit(jobs) || isProcessing}
            aria-label="Run"
          >
            {isLoading ? (
              <SpinnerDotted />
            ) : jobs.length > 0 ? (
              `Run ${jobs.length} job${jobs.length === 1 ? '' : 's'}`
            ) : (
              'Run'
            )}
          </Button>

          {/* Queue status */}
          {pendingPrompts.length > 0 && (
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <SpinnerDotted />
              <span>
                Processing {processedCount} of {totalQueued} jobs...
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={cancelQueue}
                aria-label="Cancel queue"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
