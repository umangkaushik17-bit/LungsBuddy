import { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from '../../firebase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [displayName, setDisplayNameState] = useState(() => {
        return localStorage.getItem('lungbuddy_displayName') || '';
    });

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const updateDisplayName = (name) => {
        setDisplayNameState(name);
        localStorage.setItem('lungbuddy_displayName', name);
    };

    const register = async (email, password, name) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        updateDisplayName(name);
        return cred.user;
    };

    const login = async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
    };

    const logout = async () => {
        await firebaseSignOut(auth);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            displayName,
            setDisplayName: updateDisplayName,
            register,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
