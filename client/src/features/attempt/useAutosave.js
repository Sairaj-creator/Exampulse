import { useCallback, useEffect, useRef, useState } from "react";
import { saveAnswerApi } from "./api";

const sleep = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

/**
 * Per-question debounced autosave with bounded exponential retry and an
 * explicit flush used before final submission.
 */
export function useAutosave({ attemptId, onSaveSuccess, onSaveError }) {
  const [saveStatus, setSaveStatus] = useState("saved");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const pendingRef = useRef(new Map());
  const inFlightRef = useRef(new Map());
  const revisionRef = useRef(0);
  const mountedRef = useRef(true);
  const callbacksRef = useRef({ onSaveSuccess, onSaveError });
  callbacksRef.current = { onSaveSuccess, onSaveError };

  const refreshStatus = useCallback(() => {
    if (!mountedRef.current) return;
    if (inFlightRef.current.size > 0 || pendingRef.current.size > 0) {
      setSaveStatus("saving");
    } else {
      setSaveStatus("saved");
    }
  }, []);

  const runSave = useCallback(
    async (questionId) => {
      if (inFlightRef.current.has(questionId)) {
        return inFlightRef.current.get(questionId);
      }
      const entry = pendingRef.current.get(questionId);
      if (!entry) return true;
      if (entry.timer) window.clearTimeout(entry.timer);
      entry.timer = null;

      const operation = (async () => {
        for (let retry = 0; retry <= 3; retry += 1) {
          const latest = pendingRef.current.get(questionId);
          if (!latest || latest.revision !== entry.revision) return true;
          try {
            const response = await saveAnswerApi(
              attemptId,
              questionId,
              entry.payload,
            );
            if (
              pendingRef.current.get(questionId)?.revision === entry.revision
            ) {
              pendingRef.current.delete(questionId);
            }
            if (mountedRef.current) {
              setLastSavedAt(new Date());
              callbacksRef.current.onSaveSuccess?.(response);
            }
            return true;
          } catch (error) {
            const terminal = ["ATTEMPT_EXPIRED", "ALREADY_SUBMITTED"].includes(
              error?.code,
            );
            if (terminal || retry === 3) {
              if (
                terminal &&
                pendingRef.current.get(questionId)?.revision === entry.revision
              ) {
                pendingRef.current.delete(questionId);
              }
              if (mountedRef.current) {
                setSaveStatus("error");
                callbacksRef.current.onSaveError?.(error);
              }
              return false;
            }
            if (mountedRef.current) setSaveStatus("retrying");
            await sleep(400 * 2 ** retry);
          }
        }
        return false;
      })();

      inFlightRef.current.set(questionId, operation);
      const succeeded = await operation;
      inFlightRef.current.delete(questionId);

      const next = pendingRef.current.get(questionId);
      if (next && next.revision !== entry.revision) {
        if (next.timer) window.clearTimeout(next.timer);
        next.timer = window.setTimeout(() => runSave(questionId), 0);
      } else if (!succeeded) {
        if (mountedRef.current) setSaveStatus("error");
      } else {
        refreshStatus();
      }
      return succeeded;
    },
    [attemptId, refreshStatus],
  );

  const queueSave = useCallback(
    (questionId, payload) => {
      const previous = pendingRef.current.get(questionId);
      if (previous?.timer) window.clearTimeout(previous.timer);
      const entry = {
        payload,
        revision: revisionRef.current + 1,
        timer: null,
      };
      revisionRef.current = entry.revision;
      entry.timer = window.setTimeout(() => runSave(questionId), 400);
      pendingRef.current.set(questionId, entry);
      setSaveStatus("saving");
    },
    [runSave],
  );

  const flushPending = useCallback(async () => {
    for (const entry of pendingRef.current.values()) {
      if (entry.timer) window.clearTimeout(entry.timer);
      entry.timer = null;
    }

    while (pendingRef.current.size > 0 || inFlightRef.current.size > 0) {
      const questionIds = [...pendingRef.current.keys()];
      const operations = questionIds.map((questionId) => runSave(questionId));
      operations.push(...inFlightRef.current.values());
      const results = await Promise.all(operations);
      if (results.some((result) => result === false)) return false;
    }
    refreshStatus();
    return true;
  }, [refreshStatus, runSave]);

  useEffect(() => {
    mountedRef.current = true;
    const pending = pendingRef.current;
    return () => {
      mountedRef.current = false;
      for (const entry of pending.values()) {
        if (entry.timer) window.clearTimeout(entry.timer);
      }
      pending.clear();
    };
  }, []);

  return {
    saveStatus,
    lastSavedAt,
    queueSave,
    flushPending,
    hasPending: saveStatus !== "saved",
  };
}
