const express = require('express');
const router = express.Router();
const File = require('../models/File');

router.post('/create', async (req, res) => {
  try {
    const { name, ownerId } = req.body;
    const file = new File({ name, owner: ownerId, content: '' });
    await file.save();
    const populatedFile = await File.findById(file._id).populate('owner', 'username name');
    res.json({ success: true, file: populatedFile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const files = await File.find({
      $or: [
        { owner: userId },
        { 'sharedWith.user': userId }
      ]
    }).populate('owner', 'username name').populate('sharedWith.user', 'username name');
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/share', async (req, res) => {
  try {
    const { fileId, ownerId, friendId, permission } = req.body;
    const file = await File.findById(fileId);

    if (file.owner.toString() !== ownerId) {
      return res.status(403).json({ success: false, message: 'Only the file leader/owner can manage sharing' });
    }
    
    const existingShare = file.sharedWith.find(s => s.user.toString() === friendId);
    if (existingShare) {
      existingShare.permission = permission;
    } else {
      file.sharedWith.push({ user: friendId, permission });
    }

    await file.save();
    const updatedFile = await File.findById(fileId).populate('owner', 'username name').populate('sharedWith.user', 'username name');
    res.json({ success: true, message: 'File access updated', file: updatedFile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/unshare', async (req, res) => {
  try {
    const { fileId, ownerId, friendId } = req.body;
    const file = await File.findById(fileId);

    if (file.owner.toString() !== ownerId) {
      return res.status(403).json({ success: false, message: 'Only the file leader/owner can manage sharing' });
    }

    file.sharedWith = file.sharedWith.filter(s => s.user.toString() !== friendId);
    await file.save();
    
    const updatedFile = await File.findById(fileId).populate('owner', 'username name').populate('sharedWith.user', 'username name');
    res.json({ success: true, message: 'Access revoked', file: updatedFile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;