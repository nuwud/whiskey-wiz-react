import { useState, useEffect } from 'react';
import { UserRole } from '../../types/auth.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card-ui.component';
import { PlayerTrackingService, type PlayerProfile} from '../../services/player-tracking.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Timestamp } from 'firebase/firestore';

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  lastActive: string;
  totalGames: number;
  averageScore: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const trackingService = new PlayerTrackingService();
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await trackingService.getAllPlayerProfiles();
        const mappedUsers = data.map((profile: PlayerProfile) => ({
          id: profile.userId,
          username: profile.displayName || '',
          email: profile.email || '',
          role: profile.role as UserRole,
          lastActive: profile.lastActive instanceof Timestamp 
            ? profile.lastActive.toDate().toISOString()
            : new Date().toISOString(),
          totalGames: profile.totalGames || 0,
          averageScore: profile.averageScore || 0
        }));
        setUsers(mappedUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  const getRoleDisplay = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.MODERATOR:
        return 'Mod';
      case UserRole.PLAYER:
        return 'Player';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Games</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleDisplay(user.role)}</TableCell>
                  <TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                  <TableCell>{user.totalGames}</TableCell>
                  <TableCell>{user.averageScore.toFixed(1)}</TableCell>
                  <TableCell>
                    <button 
                      className="text-sm text-blue-500 hover:text-blue-700 focus:outline-none focus:underline"
                      onClick={() => {/* Add edit functionality */}}
                    >
                      Edit
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserManagement;