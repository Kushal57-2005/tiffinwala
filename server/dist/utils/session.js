"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSession = void 0;
const getCurrentSession = () => {
    const currentHour = new Date().getHours();
    // between 10 PM–3 PM = lunch, after = dinner
    return currentHour < 3 || currentHour > 22 ? 'dinner' : 'lunch';
};
exports.getCurrentSession = getCurrentSession;
//# sourceMappingURL=session.js.map