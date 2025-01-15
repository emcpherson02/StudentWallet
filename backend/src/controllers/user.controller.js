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
}

module.exports = UserController;