const axios = require('axios');

class TransactionSeeder {
    constructor(userId, authToken) {
        this.userId = userId;
        this.authToken = authToken;
        this.baseURL = 'http://localhost:3001';
    }

    async seedTransactions() {
        const currentDate = new Date();
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

        const transactions = [
            // Recurring payments (same amount, monthly)
            ...this.generateRecurringTransactions(lastMonth),

            // Late night transactions
            ...this.generateLateNightTransactions(lastMonth),

            // Weekend spending
            ...this.generateWeekendTransactions(lastMonth),

            // Small transactions
            ...this.generateSmallTransactions(lastMonth),

            // Transport spending
            ...this.generateTransportTransactions(lastMonth),

            // Shopping transactions
            ...this.generateShoppingTransactions(lastMonth),

            // Dining out
            ...this.generateDiningTransactions(lastMonth),

            // Books and textbooks
            ...this.generateBookTransactions(lastMonth),

            // Utilities
            ...this.generateUtilityTransactions(lastMonth),

            // Groceries (high percentage)
            ...this.generateGroceryTransactions(lastMonth)
        ];

        for (const transaction of transactions) {
            try {
                await this.createTransaction(transaction);
                // Add small delay to prevent overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error('Failed to create transaction:', error);
            }
        }
    }

    generateRecurringTransactions(startDate) {
        const recurring = [
            { description: 'Netflix Subscription', amount: 9.99, category: 'Entertainment' },
            { description: 'Spotify Premium', amount: 5.99, category: 'Entertainment' },
            { description: 'Gym Membership', amount: 29.99, category: 'Health' }
        ];

        return recurring.map(item => ({
            description: item.description,
            amount: item.amount,
            category: item.category,
            date: this.getRandomDateInMonth(startDate)
        }));
    }

    generateLateNightTransactions(startDate) {
        return [
            { description: "McDonald's Late Night", amount: 8.50, date: this.getRandomDateWithTime(startDate, 23, 30), category: 'Dining Out' },
            { description: 'Late Night Uber', amount: 15.00, date: this.getRandomDateWithTime(startDate, 2, 15), category: 'Transportation' },
            { description: 'Late Night Shop', amount: 6.99, date: this.getRandomDateWithTime(startDate, 1, 20), category: 'Other' },
            { description: 'Late Night Takeaway', amount: 12.99, date: this.getRandomDateWithTime(startDate, 23, 45), category: 'Dining Out' }
        ];
    }

    generateWeekendTransactions(startDate) {
        return [
            { description: 'Weekend Shopping', amount: 150.00, date: this.getRandomWeekendDate(startDate), category: 'Shopping' },
            { description: 'Sunday Brunch', amount: 25.00, date: this.getRandomWeekendDate(startDate), category: 'Dining Out' },
            { description: 'Cinema Trip', amount: 30.00, date: this.getRandomWeekendDate(startDate), category: 'Entertainment' },
            { description: 'Weekend Takeaway', amount: 25.00, date: this.getRandomWeekendDate(startDate), category: 'Dining Out' },
            { description: 'Night Out', amount: 60.00, date: this.getRandomWeekendDate(startDate), category: 'Entertainment' }
        ];
    }

    generateSmallTransactions(startDate) {
        const small = [];
        const items = [
            { description: 'Coffee Shop', amount: 2.50, category: 'Dining Out' },
            { description: 'Corner Shop Snacks', amount: 1.99, category: 'Groceries' },
            { description: 'Bus Fare', amount: 1.80, category: 'Transportation' }
        ];

        // Generate multiple small transactions
        for (let i = 0; i < 15; i++) {
            const item = items[Math.floor(Math.random() * items.length)];
            small.push({
                ...item,
                date: this.getRandomDateInMonth(startDate)
            });
        }

        return small;
    }

    generateTransportTransactions(startDate) {
        return [
            { description: 'Train Ticket', amount: 50.00, date: this.getRandomDateInMonth(startDate), category: 'Transportation' },
            { description: 'Monthly Bus Pass', amount: 80.00, date: this.getRandomDateInMonth(startDate), category: 'Transportation' },
            { description: 'Uber', amount: 25.00, date: this.getRandomDateInMonth(startDate), category: 'Transportation' },
            { description: 'Taxi', amount: 35.00, date: this.getRandomDateInMonth(startDate), category: 'Transportation' },
            { description: 'Train Return', amount: 45.00, date: this.getRandomDateInMonth(startDate), category: 'Transportation' }
        ];
    }

    generateShoppingTransactions(startDate) {
        return [
            { description: 'ASOS', amount: 120.00, date: this.getRandomDateInMonth(startDate), category: 'Shopping' },
            { description: 'Nike Store', amount: 80.00, date: this.getRandomDateInMonth(startDate), category: 'Shopping' },
            { description: 'Apple Store', amount: 250.00, date: this.getRandomDateInMonth(startDate), category: 'Shopping' },
            { description: 'Zara', amount: 75.00, date: this.getRandomDateInMonth(startDate), category: 'Shopping' }
        ];
    }

    generateDiningTransactions(startDate) {
        const restaurants = [
            'Nando\'s',
            'Pizza Express',
            'Wagamama',
            'Five Guys',
            'Local Pub',
            'Cafe Nero',
            'Pret A Manger',
            'Subway',
            'Costa Coffee'
        ];

        return restaurants.map(restaurant => ({
            description: restaurant,
            amount: 15 + Math.random() * 15, // Random amount between £15-30
            date: this.getRandomDateInMonth(startDate),
            category: 'Dining Out'
        }));
    }

    generateBookTransactions(startDate) {
        return [
            { description: 'University Bookstore - Textbooks', amount: 150.00, date: this.getRandomDateInMonth(startDate), category: 'Education' },
            { description: 'Amazon Books', amount: 60.00, date: this.getRandomDateInMonth(startDate), category: 'Education' },
            { description: 'Textbook Shop', amount: 90.00, date: this.getRandomDateInMonth(startDate), category: 'Education' }
        ];
    }

    generateUtilityTransactions(startDate) {
        return [
            { description: 'Electricity Bill', amount: 80.00, date: this.getRandomDateInMonth(startDate), category: 'Utilities' },
            { description: 'Water Bill', amount: 40.00, date: this.getRandomDateInMonth(startDate), category: 'Utilities' },
            { description: 'Gas Bill', amount: 60.00, date: this.getRandomDateInMonth(startDate), category: 'Utilities' },
            { description: 'Internet Bill', amount: 45.00, date: this.getRandomDateInMonth(startDate), category: 'Utilities' }
        ];
    }

    generateGroceryTransactions(startDate) {
        const supermarkets = ['Tesco', 'Sainsbury\'s', 'Aldi', 'Lidl', 'Asda'];
        const groceries = [];

        // Generate multiple grocery trips to ensure high percentage
        for (let i = 0; i < 8; i++) {
            groceries.push({
                description: `${supermarkets[Math.floor(Math.random() * supermarkets.length)]} Groceries`,
                amount: 30 + Math.random() * 50, // Random amount between £30-80
                date: this.getRandomDateInMonth(startDate),
                category: 'Groceries'
            });
        }

        return groceries;
    }

    getRandomDateInMonth(startDate) {
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        const day = Math.floor(Math.random() * 28) + 1; // Avoid edge cases with month lengths
        return new Date(year, month, day).toISOString().split('T')[0];
    }

    getRandomDateWithTime(startDate, hours, minutes) {
        const date = new Date(this.getRandomDateInMonth(startDate));
        date.setHours(hours, minutes);
        return date.toISOString();
    }

    getRandomWeekendDate(startDate) {
        const date = new Date(this.getRandomDateInMonth(startDate));
        // Keep generating dates until we get a weekend
        while (date.getDay() !== 0 && date.getDay() !== 6) {
            date.setDate(date.getDate() + 1);
        }
        return date.toISOString().split('T')[0];
    }

    async createTransaction(transaction) {
        try {
            await axios.post(
                `${this.baseURL}/transactions/add_transaction`,
                {
                    userId: this.userId,
                    ...transaction
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.authToken}`
                    }
                }
            );
            console.log(`Created transaction: ${transaction.description}`);
        } catch (error) {
            console.error(`Failed to create transaction ${transaction.description}:`, error.response?.data || error.message);
        }
    }
}

// Usage example:
async function seedTransactions() {
    const userId = 'your-user-id';
    const authToken = 'your-auth-token';

    const seeder = new TransactionSeeder(userId, authToken);
    await seeder.seedTransactions();
}

module.exports = TransactionSeeder;