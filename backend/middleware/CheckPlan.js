const User = require('../models/user');
const { getSubscriptionAccess, hasPlanAccess } = require('../utils/subscription');

function checkPlan(requiredPlan) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select('plan planExpiresAt');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
          requiredPlan,
          currentPlan: 'free',
        });
      }

      const access = getSubscriptionAccess(user);

      if (access.expired && requiredPlan !== 'free') {
        return res.status(403).json({
          success: false,
          message: 'Your subscription has expired.',
          requiredPlan,
          currentPlan: 'free',
          expiredPlan: access.actualPlan,
          planExpiresAt: access.planExpiresAt,
        });
      }

      if (hasPlanAccess(access.effectivePlan, requiredPlan)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `This feature requires the ${requiredPlan} plan.`,
        requiredPlan,
        currentPlan: access.effectivePlan,
        planExpiresAt: access.planExpiresAt,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Unable to verify subscription access.',
      });
    }
  };
}

module.exports = { checkPlan };
