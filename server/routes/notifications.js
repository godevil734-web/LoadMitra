import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { requireAuth } from '../utils/auth.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Paginated list of notifications for the authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    const filter = { recipientId: userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n._id,
          recipientId: n.recipientId,
          type: n.type,
          title: n.title,
          message: n.message,
          bookingId: n.bookingId,
          listingId: n.listingId,
          verificationId: n.verificationId,
          isRead: n.isRead,
          readAt: n.readAt ? n.readAt.toISOString() : null,
          metadata: n.metadata || {},
          createdAt: n.createdAt ? n.createdAt.toISOString() : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          unreadCount,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns unread notifications count for the authenticated user
 */
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const count = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (err) {
    console.error('Error counting unread notifications:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to count unread notifications.',
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read (User must own the notification)
 */
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.',
      });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    // Verify ownership
    if (notification.recipientId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify notifications belonging to another user.',
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification.toSafeObject(),
    });
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all unread notifications for the authenticated user as read
 */
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const result = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read.',
    });
  }
});

export default router;
