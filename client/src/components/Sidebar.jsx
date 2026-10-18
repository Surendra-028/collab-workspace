import React, { useState } from 'react';

export default function Sidebar({
  user,
  files,
  activeFileId,
  onSelectFile,
  onOpenCreateModal,
  friends,
  onAddFriend,
  onShareFile,
  onUnshareFile,
  onLogout
}) {
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [shareFriendId, setShareFriendId] = useState('');
  const [sharePermission, setSharePermission] = useState('view');

  const activeFile = files.find((f) => f._id === activeFileId);
  const isOwner = activeFile && activeFile.owner._id === user._id;

  const handleAddFriendSubmit = (e) => {
    e.preventDefault();
    if (!friendUsernameInput.trim()) return;
    onAddFriend(friendUsernameInput.trim());
    setFriendUsernameInput('');
  };

  const handleShareSubmit = (e) => {
    e.preventDefault();
    if (!activeFile || !shareFriendId) return;
    onShareFile(activeFile._id, shareFriendId, sharePermission);
    setShareFriendId('');
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  return (
    <aside className="sidebar">
      {/* Top Profile / Logout Header */}
      <div className="user-profile-header">
        <div className="user-info-badge">
          <span className="user-display-name">{user.name}</span>
          <span className="user-username">@{user.username}</span>
        </div>
        <button className="collab-logout-btn" onClick={onLogout} title="Sign out of workspace">
          Sign Out
        </button>
      </div>

      {/* Documents Section */}
      <div className="sidebar-section">
        <div className="section-title">
          <span>Documents</span>
          <button className="action-sm-btn" onClick={onOpenCreateModal}>
            + New Doc
          </button>
        </div>
        <div className="item-list">
          {files.map((file) => {
            const fileIsOwner = file.owner._id === user._id;
            return (
              <div
                key={file._id}
                className={`sidebar-item ${activeFileId === file._id ? 'active' : ''}`}
                onClick={() => onSelectFile(file._id)}
              >
                <span className="file-item-name">📝 {file.name}</span>
                <span className={`badge ${fileIsOwner ? 'owner' : 'shared'}`}>
                  {fileIsOwner ? 'Leader' : file.owner.username}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* File Sharing & ACL Control (Only for Owner) */}
      {activeFile && isOwner && (
        <div className="sidebar-section share-control-box">
          <div className="section-title">Manage Access: {activeFile.name}</div>
          <form onSubmit={handleShareSubmit} className="share-form">
            <select value={shareFriendId} onChange={(e) => setShareFriendId(e.target.value)} required>
              <option value="">Select friend to grant...</option>
              {friends.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} (@{f.username})
                </option>
              ))}
            </select>
            <div className="share-row-inline">
              <select value={sharePermission} onChange={(e) => setSharePermission(e.target.value)}>
                <option value="view">Can View</option>
                <option value="edit">Can Edit</option>
              </select>
              <button type="submit" className="primary-btn sm">
                Grant Access
              </button>
            </div>
          </form>

          <div className="shared-with-list">
            <small className="muted-label">Authorized Collaborators:</small>
            {activeFile.sharedWith && activeFile.sharedWith.length === 0 ? (
              <p className="muted">Private document (No shares)</p>
            ) : (
              activeFile.sharedWith?.map((s) => (
                <div key={s.user._id} className="shared-user-row">
                  <span>
                    {s.user.name} <span className="perm-tag">({s.permission})</span>
                  </span>
                  <button className="text-danger-btn" onClick={() => onUnshareFile(activeFile._id, s.user._id)}>
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Friends System */}
      <div className="sidebar-section friends-management-area">
        <div className="section-title">Friends & Connections</div>

        <form onSubmit={handleAddFriendSubmit} className="friend-form">
          <input
            type="text"
            placeholder="Add by username..."
            value={friendUsernameInput}
            onChange={(e) => setFriendUsernameInput(e.target.value)}
          />
          <button type="submit" className="action-sm-btn">
            Add
          </button>
        </form>

        <div className="friend-search-box">
          <input
            type="text"
            placeholder="🔍 Search friends list..."
            value={friendSearchQuery}
            onChange={(e) => setFriendSearchQuery(e.target.value)}
          />
        </div>

        <div className="friend-list">
          {filteredFriends.length === 0 ? (
            <p className="muted">No matching friends found.</p>
          ) : (
            filteredFriends.map((f) => (
              <div key={f._id} className="friend-row">
                <span className="friend-name">👤 {f.name}</span>
                <span className="friend-username">@{f.username}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}