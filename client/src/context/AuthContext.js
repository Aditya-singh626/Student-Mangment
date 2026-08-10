import React, { createContext, useContext, useState, useCallback } from "react";
import { authApi, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("sms_token"));
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem("sms_user");
        return raw ? JSON.parse(raw) : null;
    });

    const persist = (nextToken, nextUser) => {
        localStorage.setItem("sms_token", nextToken);
        localStorage.setItem("sms_user", JSON.stringify(nextUser));
        setAuthToken(nextToken);
        setToken(nextToken);
        setUser(nextUser);
    };

    const login = useCallback(async (email, password) => {
        const { data } = await authApi.login(email, password);
        persist(data.token, data.user);
        return data.user;
    }, []);

    const register = useCallback(async (payload) => {
        // Registration does not return a token, so log in right after
        await authApi.register(payload);
        const { data } = await authApi.login(payload.email, payload.password);
        persist(data.token, data.user);
        return data.user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("sms_token");
        localStorage.removeItem("sms_user");
        setAuthToken(null);
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}