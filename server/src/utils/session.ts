export const getCurrentSession = (): 'lunch' | 'dinner' => {
    const currentHour = new Date().getHours();

    // between 10 PM–3 PM = lunch, after = dinner
    return currentHour < 3 || currentHour > 22 ? 'dinner' : 'lunch';
};
