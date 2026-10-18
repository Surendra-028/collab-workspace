import React, { useState, useEffect, useRef } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import DocumentEditor from './components/DocumentEditor';

export default function App() {
  // 1. Declare ALL useState and useRef hooks FIRST
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('collab_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [documentContent, setDocumentContent] = useState('');
  const [notification, setNotification] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const wsRef = useRef(null);

  // 2. Computed variables (declared AFTER useState)
  const activeFile = files.find((f) => f._id === activeFileId);

  // 3. Helper Functions
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('collab_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('collab_user');
    showNotification('Signed out securely', 'success');
  };

  // 4. useEffect Hooks
  useEffect(() => {
    if (!user) return;
    fetchUserData(user._id);
  }, [user]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // WebSocket sync listener
  useEffect(() => {
    if (!activeFileId || !user) return;

    const ws = new WebSocket(`ws://localhost:5000?room=${activeFileId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'DOC_UPDATE' && data.fileId === activeFileId) {
          setDocumentContent(data.content);
          setFiles((prev) =>
            prev.map((f) => (f._id === activeFileId ? { ...f, content: data.content } : f))
          );
        } else if (data.type === 'ACCESS_REVOKED') {
          if (data.revokedUserId === user._id) {
            showNotification('Your access to this document was revoked.', 'error');
            setFiles((prev) => prev.filter((f) => f._id !== data.fileId));
            setActiveFileId(null);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    return () => ws.close();
  }, [activeFileId, user]);

  useEffect(() => {
    if (activeFile) {
      setDocumentContent(activeFile.content);
    }
  }, [activeFileId]);

  const fetchUserData = async (userId) => {
    try {
      const filesRes = await fetch(`http://localhost:5000/api/files/user/${userId}`);
      const filesData = await filesRes.json();
      if (filesData.success) {
        setFiles(filesData.files);
        if (filesData.files.length > 0 && !activeFileId) {
          setActiveFileId(filesData.files[0]._id);
        }
      }

      const friendsRes = await fetch(`http://localhost:5000/api/friends/${userId}`);
      const friendsData = await friendsRes.json();
      if (friendsData.success) {
        setFriends(friendsData.friends);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFriend = async (friendUsername) => {
    try {
      const res = await fetch('http://localhost:5000/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, friendUsername })
      });
      const data = await res.json();
      if (data.success) {
        setFriends([...friends, data.friend]);
        showNotification(`Successfully added @${data.friend.username} as friend!`, 'success');
      } else {
        showNotification(data.message, 'error');
      }
    } catch (err) {
      showNotification('Failed to add friend connection', 'error');
    }
  };

  const handleCreateDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDocName.trim(), ownerId: user._id })
      });
      const data = await res.json();
      if (data.success) {
        setFiles([...files, data.file]);
        setActiveFileId(data.file._id);
        showNotification(`Created document "${newDocName.trim()}" successfully`, 'success');
        setIsModalOpen(false);
        setNewDocName('');
      }
    } catch (err) {
      showNotification('Failed to create document', 'error');
    }
  };

  const handleShareFile = async (fileId, friendId, permission) => {
    try {
      const res = await fetch('http://localhost:5000/api/files/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, ownerId: user._id, friendId, permission })
      });
      const data = await res.json();
      if (data.success) {
        setFiles(files.map((f) => (f._id === fileId ? data.file : f)));
        showNotification('Document access updated successfully!', 'success');
      } else {
        showNotification(data.message, 'error');
      }
    } catch (err) {
      showNotification('Failed to grant document access', 'error');
    }
  };

  const handleUnshareFile = async (fileId, friendId) => {
    try {
      const res = await fetch('http://localhost:5000/api/files/unshare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, ownerId: user._id, friendId })
      });
      const data = await res.json();
      if (data.success) {
        setFiles(files.map((f) => (f._id === fileId ? data.file : f)));

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'ACCESS_REVOKED',
              fileId,
              revokedUserId: friendId
            })
          );
        }

        showNotification('Collaborator access revoked immediately', 'success');
      } else {
        showNotification(data.message, 'error');
      }
    } catch (err) {
      showNotification('Failed to revoke access', 'error');
    }
  };

  const handleContentChange = (newContent) => {
    setDocumentContent(newContent);
    setFiles(files.map((f) => (f._id === activeFileId ? { ...f, content: newContent } : f)));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'DOC_UPDATE', fileId: activeFileId, content: newContent })
      );
    }
  };

  if (!user) {
    return (
      <>
        {notification && (
          <div className={`toast-notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        <Auth onLoginSuccess={handleLoginSuccess} showNotification={showNotification} />
      </>
    );
  }

  return (
    <div className="workspace-container">
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Global Ctrl+K Search Modal */}
      {isGlobalSearchOpen && (
        <div className="modal-overlay" onClick={() => setIsGlobalSearchOpen(false)}>
          <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <input
                type="text"
                placeholder="Type to search all documents across workspace..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                autoFocus
              />
              <span className="kbd-shortcut">ESC</span>
            </div>
            <div className="search-results-list">
              {files
                .filter(
                  (f) =>
                    f.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    f.content.toLowerCase().includes(globalSearchQuery.toLowerCase())
                )
                .map((file) => (
                  <div
                    key={file._id}
                    className="search-result-item"
                    onClick={() => {
                      setActiveFileId(file._id);
                      setIsGlobalSearchOpen(false);
                      setGlobalSearchQuery('');
                    }}
                  >
                    <span className="res-title">📝 {file.name}</span>
                    <span className="res-snippet">
                      {file.content.substring(0, 60)}...
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Centered Document Creation Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Create New Document</h3>
            <p>Enter a title for your new document workspace.</p>
            <form onSubmit={handleCreateDocumentSubmit}>
              <input
                type="text"
                placeholder="e.g. Research_Proposal.md"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                autoFocus
                required
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="collab-primary-btn">
                  Create Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Sidebar
        user={user}
        files={files}
        activeFileId={activeFileId}
        onSelectFile={setActiveFileId}
        onOpenCreateModal={() => setIsModalOpen(true)}
        friends={friends}
        onAddFriend={handleAddFriend}
        onShareFile={handleShareFile}
        onUnshareFile={handleUnshareFile}
        onLogout={handleLogout}
      />
      <DocumentEditor
        file={activeFile}
        content={documentContent}
        onChange={handleContentChange}
        user={user}
      />
    </div>
  );
}