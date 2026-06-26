const User = require('../models/user');
const { getSubscriptionAccess, hasPlanAccess } = require('../utils/subscription');

const planCache = new Map();
const PLAN_CACHE_TTL = 60_000; // 60 s

function checkPlan(requiredPlan) {
  return async (req, res, next) => {
    try {
      const cached = planCache.get(req.user.id);
      if (cached && Date.now() - cached.ts < PLAN_CACHE_TTL) {
        const access = getSubscriptionAccess({ plan: cached.plan, planExpiresAt: cached.planExpiresAt });
        if (access.expired && requiredPlan !== 'free') {
          return res.status(403).json({ success: false, message: 'Your subscription has expired.', requiredPlan, currentPlan: 'free', expiredPlan: access.actualPlan, planExpiresAt: access.planExpiresAt });
        }
        if (hasPlanAccess(access.effectivePlan, requiredPlan)) return next();
        return res.status(403).json({ success: false, message: `This feature requires the ${requiredPlan} plan.`, requiredPlan, currentPlan: access.effectivePlan, planExpiresAt: access.planExpiresAt });
      }

      const user = await User.findById(req.user.id).select('plan planExpiresAt');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
          requiredPlan,
          currentPlan: 'free',
        });
      }

      planCache.set(req.user.id, { plan: user.plan, planExpiresAt: user.planExpiresAt, ts: Date.now() });

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
