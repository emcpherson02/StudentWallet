import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

// Token refresh function
export const refreshToken = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
        try {
            const newToken = await currentUser.getIdToken(true);
            sessionStorage.setItem('token', newToken);

            // Set token expiration (1 hour from now)
            const expirationTime = Date.now() + 3600 * 1000;
            sessionStorage.setItem('tokenExpiration', expirationTime.toString());
        } catch (error) {
            console.error('Error refreshing token:', error);
            // Handle logout if refresh fails
            await logoutUser();
        }
    }
};

// Check token expiration
export const checkTokenExpiration = () => {
    const tokenExp = sessionStorage.getItem('tokenExpiration');
    if (tokenExp && Date.now() >= parseInt(tokenExp)) {
        logoutUser();
    }
};

// Logout function
export const logoutUser = async () => {
    const auth = getAuth();
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Error signing out:', error);
    } finally {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('tokenExpiration');
    }
};

/**
 * Registers a new user with the given email, password, name, and date of birth.
 * @param email
 * @param password
 * @param name
 * @param dob
 * @returns {Promise<User>}
 */
export async function registerUser(email, password, name, dob) {
    const auth = getAuth();
    const db = getFirestore();

    const userCredential = await createUserWithEmailAndPassword(auth, email, password); // Create user with email and password
    const user = userCredential.user;

    // Set displayName on the Firebase Authentication user profile
    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        dob: dob,
        email: email,
        linkedBank: false, // Set linkedBank to false by default
    });

    return user;
}

/**
 * Logs in a user with the given email and password.
 * @param email
 * @param password
 * @returns {Promise<User>}
 */
export async function loginUser(email, password) {
    const auth = getAuth();
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return (userCredential.user);

    } catch (error) {
        throw error;
    }
}

