class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    async getUserData(req, res, next) {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({
                    message: 'Missing userId parameter'
                });
            }

            const userData = await this.userService.getUserData(userId);
            res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async getUserDetails(req, res, next) {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({
                    message: 'Missing userId parameter'
                });
            }

            const userDetails = await this.userService.getUserDetails(userId);
            res.json(userDetails);
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req, res, next) {
        try {
            const { userId } = req.params;
            const updates = req.body;

            const updatedUser = await this.userService.updateUser(userId, updates);

            res.status(200).json({
                status: 'success',
                message: 'User details updated successfully',
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req, res, next) {
        try {
            const { userId } = req.params;

            await this.userService.deleteUser(userId);

            res.status(200).json({
                status: 'success',
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async toggleNotifications(req, res, next) {
        try {
            const { userId, enabled } = req.body;
            const result = await this.userService.toggleNotifications(userId, enabled);

            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getNotificationHistory(req, res, next) {
        try {
            const { userId } = req.query;
            const notifications = await this.userService.getNotificationHistory(userId);
            res.json({ notifications });
        } catch (error) {
            next(error);
        }
    }

    async addCategory(req, res, next) {
        try {
            const { userId, category } = req.body;
            const newCategory = await this.userService.addCategory(userId, category);

            res.status(201).json({
                status: 'success',
                message: 'Category added successfully',
                data: newCategory
            });
        } catch (error) {
            next(error);
        }
    }

    async getCategories(req, res, next) {
        try {
            const { userId } = req.query;
            const categories = await this.userService.getCategories(userId);

            res.status(200).json({
                status: 'success',
                data: categories
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteCategory(req, res, next) {
        try {
            const { userId } = req.body;
            const { category } = req.params;

            await this.userService.deleteCategory(userId, category);

            res.status(200).json({
                status: 'success',
                message: 'Category deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // Add method to handle email preferences
    async updateEmailPreferences(req, res, next) {
        try {
            const { userId } = req.params;
            const { emailPreferences } = req.body;

            const updatedUser = await this.userService.updateEmailPreferences(userId, emailPreferences);

            res.status(200).json({
                status: 'success',
                message: 'Email preferences updated successfully',
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }

    async getEmailPreferences(req, res, next) {
        try {
            const { userId } = req.query;
            const emailPreferences = await this.userService.getEmailPreferences(userId);

            res.status(200).json({
                status: 'success',
                data: emailPreferences
            });
        } catch (error) {
            next(error);
        }
    }

    async changeEmail(req, res, next) {
        try {
            const { userId, email, currentPassword } = req.body;

            if (!userId || !email || !currentPassword) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
            }

            const result = await this.userService.changeEmail(userId, email, currentPassword);

            res.status(200).json({
                status: 'success',
                message: 'Email updated successfully',
                data: result
            });
        } catch (error) {
            if (error.code) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                    code: error.code
                });
            }
            next(error);
        }
    }
}

module.exports = UserController;