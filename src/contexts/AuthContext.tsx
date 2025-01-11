
import React, { createContext, useContext, useState, ReactNode } from 'react';



interface AuthContextType {

    isAdmin: boolean;

}



const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    const [isAdmin, setIsAdmin] = useState(false);



    return (

        <AuthContext.Provider value={{ isAdmin }}>

            {children}

        </AuthContext.Provider>

    );

};



export const useAuth = (): AuthContextType => {

    const context = useContext(AuthContext);

    if (!context) {

        throw new Error('useAuth must be used within an AuthProvider');

    }

    return context;

};
