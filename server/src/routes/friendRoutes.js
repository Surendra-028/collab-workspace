const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/add', async (req, res) => {
  try {
    const { userId, friendUsername } = req.body;
    const friend = await User.findOne({ username: friendUsername });
    if (!friend) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (friend._id.toString() === userId) {
      return res.status(400).json({ success: false, message: 'You cannot add yourself' });
    }

    const user = await User.findById(userId);
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    user.friends.push(friend._id);
    await user.save();

    res.json({ success: true, message: 'Friend added successfully', friend: { _id: friend._id, username: friend.username, name: friend.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('friends', 'username name email');
    res.json({ success: true, friends: user.friends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;