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
    let cm = part.cadMetadata;
    if (cm) {
      const isLargeCad = typeof cm.cadFile === 'string' && (cm.cadFile.length > 50000 || cm.cadFile.startsWith('data:'));
      const isLargeStep = typeof cm.stepFile === 'string' && (cm.stepFile.length > 50000 || cm.stepFile.startsWith('data:'));
      const isLargePdf = typeof cm.pdfFile === 'string' && (cm.pdfFile.length > 50000 || cm.pdfFile.startsWith('data:'));

      let attached = cm.attachedFiles;
      if (Array.isArray(attached)) {
        attached = attached.map(f => {
          if (typeof f?.dataUrl === 'string' && f.dataUrl.length > 50000) {
            return { ...f, dataUrl: '' };
          }
          return f;
        });
      }

      cm = {
        ...cm,
        cadFile: isLargeCad ? undefined : cm.cadFile,
        stepFile: isLargeStep ? undefined : cm.stepFile,
        pdfFile: isLargePdf ? undefined : cm.pdfFile,
        attachedFiles: attached
      };
    }

    // Also sanitize revisionHistory
    let revHistory = part.revisionHistory;
    if (Array.isArray(revHistory)) {
      revHistory = revHistory.map(rev => {
        if (rev && Array.isArray(rev.attachedFiles)) {
          return {
            ...rev,
            attachedFiles: rev.attachedFiles.map((f: any) => {
              if (typeof f?.dataUrl === 'string' && f.dataUrl.length > 50000) {
                return { ...f, dataUrl: '' };
              }
              return f;
            })
          };
        }
        return rev;
      });
    }

    return {
      ...part,
      cadMetadata: cm,
      revisionHistory: revHistory
    };
  });
}

/**
 * Strip all large base64 file data URLs before sending part to MongoDB Atlas backend.
 * Keeps all metadata intact while ensuring the payload is ~15KB instead of 50MB.
 */
export function preparePartForBackend(part: PartItem): PartItem {
  const sanitized = sanitizePartsForStorage([part])[0] || part;
  const cm = sanitized.cadMetadata ? { ...sanitized.cadMetadata } : undefined;
  if (cm) {
    delete cm.cadFile;
    delete cm.stepFile;
    delete cm.pdfFile;
    if (Array.isArray(cm.attachedFiles)) {
      cm.attachedFiles = cm.attachedFiles.map((item: any) => {
        const { dataUrl: _drop, ...rest } = item || {};
        return { ...rest, dataUrl: '' };
      });
    }
  }

  let revHistory = sanitized.revisionHistory;
  if (Array.isArray(revHistory)) {
    revHistory = revHistory.map(rev => {
      if (rev && Array.isArray(rev.attachedFiles)) {
        return {
          ...rev,
          attachedFiles: rev.attachedFiles.map((f: any) => {
            const { dataUrl: _drop, ...rest } = f || {};
            return { ...rest, dataUrl: '' };
          })
        };
      }
      return rev;
    });
  }

  return {
    ...sanitized,
    ...(cm ? { cadMetadata: cm } : {}),
    revisionHistory: revHistory
  };
}

/**
 * Strip large base64 file data URLs before sending document to MongoDB Atlas backend.
 */
export function prepareDocumentForBackend(doc: EngineeringDocument): EngineeringDocument {
  if (typeof doc.fileUrl === 'string' && (doc.fileUrl.length > 50000 || doc.fileUrl.startsWith('data:'))) {
    return {
      ...doc,
      fileUrl: ''
    };
  }
  return doc;
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
      } catch {
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
