import { useAuth } from '../../contexts/auth.context';

const { user } = useAuth();

console.log('Guest authentication state:', {
    isAuthenticated: user?.guest,
    userId: user?.userId
});
