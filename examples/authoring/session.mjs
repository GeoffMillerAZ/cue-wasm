export function diagnosticMessage(error) {
  const message = String(error?.message ?? error);
  try {
    const diagnostic = JSON.parse(message);
    if (typeof diagnostic.message === 'string') {
      const location = typeof diagnostic.file === 'string' && diagnostic.file
        ? `${diagnostic.file}${Number.isInteger(diagnostic.line) ? ':' + diagnostic.line : ''}: ` : '';
      return location + diagnostic.message + (typeof diagnostic.details === 'string' ? '\n' + diagnostic.details : '');
    }
  } catch { /* Non-CUE transport errors remain readable. */ }
  return message;
}

// Consumer-owned draft state. Only the injected public worker API crosses this boundary.
export function createAuthoringSession({load, schema, draft, onChange = () => {}}) {
  let worker, operation, generation = 0, disposed = false;
  const state = {phase: 'idle', draft, revision: 0, preview: null, previewRevision: -1, error: null};
  const snapshot = () => ({...state, fresh: state.preview !== null && state.previewRevision === state.revision,
    preview: state.preview === null ? null : structuredClone(state.preview)});
  const publish = () => { if (!disposed) onChange(snapshot()); };
  const live = () => { if (disposed) throw Error('Authoring session disposed'); };
  function retire() {
    generation++;
    operation?.abort(); operation = undefined;
    worker?.dispose(); worker = undefined;
  }
  async function start() {
    live(); retire();
    const owner = generation, abort = operation = new AbortController();
    state.phase = 'loading'; state.error = null; publish();
    try {
      const candidate = await load({mode: 'engine', maxPending: 1, maxInputBytes: 128 * 1024,
        timeoutMs: 10000, initializationTimeoutMs: 30000, signal: abort.signal});
      if (disposed || generation !== owner) { candidate.dispose(); return false; }
      worker = candidate; state.phase = 'ready'; publish(); return true;
    } catch (error) {
      if (!disposed && generation === owner) { state.phase = 'failed'; state.error = diagnosticMessage(error); publish(); }
      return false;
    } finally { if (generation === owner) operation = undefined; }
  }
  function edit(text) {
    live();
    if (typeof text !== 'string' || new TextEncoder().encode(text).length > 64 * 1024) throw Error('Draft limit is 64 KiB');
    if (text === state.draft) return;
    state.draft = text; state.revision++; state.error = null; publish();
  }
  async function run(kind) {
    live();
    if (!worker || state.phase !== 'ready') return false;
    const owner = generation, revision = state.revision, text = state.draft;
    const abort = operation = new AbortController();
    state.phase = kind === 'format' ? 'formatting' : 'evaluating'; state.error = null; publish();
    try {
      const result = kind === 'format' ? await worker.format(text, {signal: abort.signal})
        : await worker.unify({'/schema.cue': schema, '/draft.cue': text}, undefined, undefined, {signal: abort.signal});
      if (disposed || owner !== generation || revision !== state.revision) return false;
      if (kind === 'format') edit(result);
      else { state.preview = JSON.parse(result); state.previewRevision = revision; }
      return true;
    } catch (error) {
      if (!disposed && owner === generation && revision === state.revision) state.error = diagnosticMessage(error);
      return false;
    } finally {
      if (!disposed && owner === generation) {
        operation = undefined;
        if (worker.state === 'ready') state.phase = 'ready';
        else { worker.dispose(); worker = undefined; state.phase = 'failed'; }
        publish();
      }
    }
  }
  return {
    snapshot, start, edit, evaluate: () => run('evaluate'), format: () => run('format'),
    cancel() { live(); retire(); state.phase = 'idle'; state.error = null; publish(); },
    exportJSON() { live(); if (!snapshot().fresh) throw Error('Evaluate the current draft before exporting'); return JSON.stringify(state.preview, null, 2) + '\n'; },
    dispose() { if (disposed) return; disposed = true; retire(); },
  };
}
