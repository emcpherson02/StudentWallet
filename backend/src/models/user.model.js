class UserModel {
    constructor(db) {
        this.db = db;
        this.collection = 'users';
    }

    async findByEmail(email) {
        const doc = await this.db.collection(this.collection).doc(email).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async create(userData) {
        const { email } = userData;
        await this.db.collection(this.collection).doc(email).set(userData);
        return { id: email, ...userData };
    }
}

module.exports = UserModel;