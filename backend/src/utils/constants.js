const TRANSACTION_CATEGORIES = {
    GROCERIES: 'Groceries',
    RENT: 'Rent',
    UTILITIES: 'Utilities',
    TRANSPORTATION: 'Transportation',
    ENTERTAINMENT: 'Entertainment',
    EDUCATION: 'Education',
    SHOPPING: 'Shopping',
    HEALTH: 'Health',
    DINING: 'Dining Out',
    OTHER: 'Other'
};

const validateCategory = async (category, userModel, userId) => {
    // Check default categories
    const defaultValid = Object.values(TRANSACTION_CATEGORIES).includes(category);
    if (defaultValid) return true;

    // Check custom categories
    try {
        const customCategories = await userModel.getCategories(userId);
        return customCategories.includes(category);
    } catch (error) {
        console.error('Error validating category:', error);
        return false;
    }
};

module.exports = {
    DB_COLLECTION_USERS: 'users',
    STATUS_FAIL: 'fail',
    STATUS_SUCCESS: 'success',
    MESSAGE_INVALID_CREDENTIALS: 'Invalid credentials',
    MESSAGE_LOGIN_SUCCESSFUL: 'Login successful!',
    MESSAGE_REGISTRATION_SUCCESSFUL: 'Registration successful!',
    MESSAGE_USER_EXISTS: 'User already exists',
    MESSAGE_ERROR_OCCURRED: 'An error occurred. Please try again.',
    MESSAGE_UNAUTHORIZED: 'Unauthorized',
    MESSAGE_USER_NOT_FOUND: 'User not found',
    MESSAGE_INVALID_TOKEN: 'Invalid token',
    TRANSACTION_CATEGORIES,
    validateCategory
};