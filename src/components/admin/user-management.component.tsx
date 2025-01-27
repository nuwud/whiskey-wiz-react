"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card-ui.component';
import { PlayerTrackingService } from 'src/services/player-tracking.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface User {
  id: string;
  username: string;
  email: string;
  roles: {
    admin: boolean;
    player: boolean;
    moderator: boolean;
  };
  lastActive: string;
  totalGames: number;
  averageScore: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const trackingService = new PlayerTrackingService();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await trackingService.getAllPlayerProfiles();
        const mappedUsers = data.map(profile => ({
          id: profile.userId,
          username: profile.displayName || '',
          email: profile.email || '',
          roles: {
            admin: profile.role === 'admin',
            player: profile.role === 'player',
            moderator: profile.role === 'moderator'
          },
          lastActive: typeof profile.lastActive === 'string' ? profile.lastActive : profile.lastActive?.timestamp?.toISOString() || new Date().toISOString(),
          totalGames: profile.totalGames || 0,
          averageScore: profile.averageScore || 0
        }));
        setUsers(mappedUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Loading users...</div>;

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
                  <TableCell>
                    {user.roles.admin ? 'Admin' : user.roles.moderator ? 'Mod' : 'Player'}
                  </TableCell>
                  <TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                  <TableCell>{user.totalGames}</TableCell>
                  <TableCell>{user.averageScore}</TableCell>
                  <TableCell>
                    <button className="text-sm text-blue-500 hover:text-blue-700">
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