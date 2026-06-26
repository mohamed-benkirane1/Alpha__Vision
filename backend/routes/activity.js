const router = require('express').Router();
const auth = require('../middleware/auth');
const { getUserActivities } = require('../services/activityService');

router.get('/', auth, async (req, res) => {
  try {
    const { activities, pagination } = await getUserActivities(req.user.id, req.query);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      activities,
      pagination,
      warnings: [],
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      activities: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
      warnings: [],
      error: error.message || 'Unable to load activity.',
    });
  }
});

module.exports = router;
