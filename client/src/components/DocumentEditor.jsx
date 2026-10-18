import React, { useState } from 'react';

export default function DocumentEditor({ file, content, onChange, user, activeUsers = [] }) {
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'

  if (!file) {
    return (
      <main className="editor-pane empty-state">
        <h2>Select or create a document to start writing.</h2>
      </main>
    );
  }

  const isOwner = file.owner._id === user._id;
  const userShare = file.sharedWith?.find(s => s.user._id === user._id);
  const canEdit = isOwner || (userShare && userShare.permission === 'edit');

  // Simple Markdown Parser for Preview Mode
  const renderMarkdown = (text) => {
    if (!text) return '<p class="muted">Empty document...</p>';
    return text
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  const handleExport = (format) => {
    let blob, filename;
    if (format === 'md') {
      blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
      filename = `${file.name || 'document'}.md`;
    } else {
      const htmlContent = `<!DOCTYPE html><html><head><title>${file.name}</title></head><body>${renderMarkdown(content)}</body></html>`;
      blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      filename = `${file.name || 'document'}.html`;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="editor-pane">
      <div className="editor-header">
        <div>
          <h2>{file.name}</h2>
          <span className="document-meta">
            Leader: <strong>{file.owner.name}</strong> (@{file.owner.username}) | 
            Permission: <span className="permission-badge">{isOwner ? 'Leader (Full Access)' : (canEdit ? 'Editor' : 'Viewer')}</span>
          </span>
        </div>

        {/* Top Header Controls: Presence, Preview Toggle & Export */}
        <div className="editor-toolbar-actions">
          {/* Live Presence Badges */}
          <div className="presence-cluster" title="Active users in this room">
            {activeUsers.map((u, idx) => (
              <span key={idx} className="presence-avatar" title={u.name}>
                {u.name.charAt(0).toUpperCase()}
              </span>
            ))}
          </div>

          <div className="view-mode-switch">
            <button
              className={`toolbar-btn ${viewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setViewMode('edit')}
            >
              Edit
            </button>
            <button
              className={`toolbar-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              Preview
            </button>
          </div>

          <div className="export-dropdown">
            <button className="toolbar-btn export" onClick={() => handleExport('md')}>📥 Export .md</button>
            <button className="toolbar-btn export" onClick={() => handleExport('html')}>📥 Export .html</button>
          </div>
        </div>
      </div>

      <div className="editor-wrapper">
        {viewMode === 'edit' ? (
          <textarea
            className="clean-doc-textarea"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            disabled={!canEdit}
            placeholder={canEdit ? "Start typing your document..." : "You have view-only access to this document."}
          />
        ) : (
          <div
            className="markdown-preview-pane"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}
      </div>
    </main>
  );
}