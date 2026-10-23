import type { EngineeringDocument, PartItem } from '../types/plm';

/**
 * Remove heavy cached files and large data URLs from localStorage to free up browser quota
 */
export function pruneOversizedStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Heavy binary cache keys from old vault implementations
      if (key.startsWith('apex_vault_file_') || key.startsWith('apex_vault_cad_') || key.startsWith('apex_vault_pdf_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  } catch (err) {
    console.warn('Could not prune localStorage quota:', err);
  }
}

/**
 * Strip oversized base64 data URLs from documents before saving to localStorage.
 * Keeps full metadata (ID, part number, revision, title, author, dates, sizes, status).
 */
export function sanitizeDocumentsForStorage(docs: EngineeringDocument[]): EngineeringDocument[] {
  if (!Array.isArray(docs)) return [];
  return docs.map(doc => {
    const isLargeUrl = typeof doc.fileUrl === 'string' && doc.fileUrl.startsWith('data:') && doc.fileUrl.length > 50000;
    const isLargeContent = typeof doc.content === 'string' && doc.content.length > 50000;

    if (isLargeUrl || isLargeContent) {
      return {
        ...doc,
        fileUrl: isLargeUrl ? undefined : doc.fileUrl,
        content: isLargeContent ? undefined : doc.content
      };
    }
    return doc;
  });
}

/**
 * Strip oversized base64 CAD/PDF data URLs from parts before saving to localStorage.
 */
export function sanitizePartsForStorage(parts: PartItem[]): PartItem[] {
  if (!Array.isArray(parts)) return [];
  return parts.map(part => {
    if (!part.cadMetadata) return part;

    const cm = part.cadMetadata;
    const isLargeCad = typeof cm.cadFile === 'string' && cm.cadFile.length > 50000;
    const isLargeStep = typeof cm.stepFile === 'string' && cm.stepFile.length > 50000;
    const isLargePdf = typeof cm.pdfFile === 'string' && cm.pdfFile.length > 50000;

    let attached = cm.attachedFiles;
    if (Array.isArray(attached)) {
      attached = attached.map(f => {
        if (typeof f.dataUrl === 'string' && f.dataUrl.length > 50000) {
          return { ...f, dataUrl: '' };
        }
        return f;
      });
    }

    if (isLargeCad || isLargeStep || isLargePdf || attached !== cm.attachedFiles) {
      return {
        ...part,
        cadMetadata: {
          ...cm,
          cadFile: isLargeCad ? undefined : cm.cadFile,
          stepFile: isLargeStep ? undefined : cm.stepFile,
          pdfFile: isLargePdf ? undefined : cm.pdfFile,
          attachedFiles: attached
        }
      };
    }
    return part;
  });
}

/**
 * Safe localStorage setter with automatic quota recovery and fallback handling.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    const isQuotaError =
      e?.name === 'QuotaExceededError' ||
      e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e?.code === 22 ||
      e?.code === 1014;

    if (isQuotaError) {
      console.warn(`[SafeStorage] LocalStorage quota exceeded on key "${key}". Pruning heavy caches...`);
      pruneOversizedStorage();

      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        // If still failing and setting documents or parts, attempt emergency strip
        if (key === 'apex_plm_documents') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              const stripped = parsed.map((d: any) => ({
                id: d.id,
                title: d.title,
                docNumber: d.docNumber,
                type: d.type,
                linkedPartId: d.linkedPartId,
                revision: d.revision,
                author: d.author,
                uploadDate: d.uploadDate,
                fileSize: d.fileSize,
                status: d.status,
                fileName: d.fileName,
                fileExtension: d.fileExtension,
                category: d.category,
                description: d.description
              }));
              localStorage.setItem(key, JSON.stringify(stripped));
              return true;
            }
          } catch {
            // ignore
          }
        }
        console.warn(`[SafeStorage] Unable to persist "${key}" to localStorage due to browser storage quota limit.`);
        return false;
      }
    }
    console.warn(`[SafeStorage] Failed to set localStorage key "${key}":`, e);
    return false;
  }
}
