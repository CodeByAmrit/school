export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', { dateStyle: 'medium' }).format(date);
};

export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('default', { style: 'currency', currency }).format(amount);
};
