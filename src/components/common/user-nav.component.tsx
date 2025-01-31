import { useAuthStore } from '../../store/auth.store';
import { Avatar, AvatarFallback } from '../../components/ui/avatar-ui.component';
import { Button } from '../../components/ui/button-ui.component';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export function UserNav() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignIn = () => navigate('/auth/signin');
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems: MenuItem[] = user ? [
    { label: 'Profile', href: '/profile' },
    { label: 'Sign Out', onClick: handleSignOut }
  ] : [
    { label: 'Sign In', onClick: handleSignIn }
  ];

  const handleSelect = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      navigate(item.href);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.displayName?.[0] ?? 'G'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.displayName ?? 'Guest'}
            </p>
            {!user && (
              <p className="text-xs leading-none text-muted-foreground">
                Sign in to play
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onSelect={() => handleSelect(item)}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}