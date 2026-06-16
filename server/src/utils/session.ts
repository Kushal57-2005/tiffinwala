export const getCurrentSession = (): 'lunch' | 'dinner' => {
    const currentHour = new Date().getHours();

    // lunch: midnight–3 PM, dinner: 3 PM onwards
    return currentHour >= 15 ? 'dinner' : 'lunch';
};
