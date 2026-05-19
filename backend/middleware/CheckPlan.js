const User = require('../models/user');

// Vérifier si l'utilisateur a le plan requis
function checkPlan(requiredPlan) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      const planLevel = { free: 0, pro: 1, elite: 2 };
      
      if (planLevel[user.plan] >= planLevel[requiredPlan]) {
        next();
      } else {
        res.status(403).json({ 
          message: `Cette fonctionnalité nécessite le plan ${requiredPlan}. Upgradez votre compte !`,
          requiredPlan: requiredPlan,
          currentPlan: user.plan
        });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
}

module.exports = { checkPlan };
