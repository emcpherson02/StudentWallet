const setupLoanRoutes = (router, loanController, authMiddleware) => {
    // Add a new maintenance loan
    router.post(
        '/add_loan',
        authMiddleware.verifyToken,
        loanController.addLoan.bind(loanController)
    );

    // Get user's maintenance loan
    router.get(
        '/get_loan',
        authMiddleware.verifyToken,
        loanController.getLoan.bind(loanController)
    );

    // Update maintenance loan
    router.put(
        '/update_loan/:loanId',
        authMiddleware.verifyToken,
        loanController.updateLoan.bind(loanController)
    );

    // Delete maintenance loan
    router.delete(
        '/delete_loan/:loanId',
        authMiddleware.verifyToken,
        loanController.deleteLoan.bind(loanController)
    );

    // Link all transactions to loan
    router.post(
        '/link_all_transactions/:loanId',
        authMiddleware.verifyToken,
        loanController.linkAllTransactions.bind(loanController)
    );

    // Unlink all transactions from loan
    router.delete(
        '/unlink_all_transactions/:loanId',
        authMiddleware.verifyToken,
        loanController.unlinkAllTransactions.bind(loanController)
    );

    router.post(
        '/link_transaction/:loanId',
        authMiddleware.verifyToken,
        loanController.linkSingleTransaction.bind(loanController)
    );

    return router;
};

module.exports = setupLoanRoutes;