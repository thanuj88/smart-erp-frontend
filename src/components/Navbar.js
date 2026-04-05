import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Store as StoreIcon,
  Dashboard as DashboardIcon,
  PointOfSale as PointOfSaleIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  AccountCircle,
  Logout as LogoutIcon
} from '@mui/icons-material';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: 'white', 
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StoreIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              color: 'text.primary',
              fontWeight: 600,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Shop Inventory
          </Typography>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flex: 1, justifyContent: 'center' }}>
          <Button 
            component={Link} 
            to="/" 
            startIcon={<DashboardIcon />}
            sx={{ textTransform: 'none', color: 'text.primary' }}
          >
            Dashboard
          </Button>
          <Button 
            component={Link} 
            to="/sell" 
            startIcon={<PointOfSaleIcon />}
            sx={{ textTransform: 'none', color: 'text.primary' }}
          >
            Sell Items
          </Button>
          {isAdmin && (
            <>
              <Button 
                component={Link} 
                to="/inventory" 
                startIcon={<InventoryIcon />}
                sx={{ textTransform: 'none', color: 'text.primary' }}
              >
                Inventory
              </Button>
              <Button 
                component={Link} 
                to="/sales-report" 
                startIcon={<AssessmentIcon />}
                sx={{ textTransform: 'none', color: 'text.primary' }}
              >
                Sales Report
              </Button>
              <Button 
                component={Link} 
                to="/users" 
                startIcon={<PeopleIcon />}
                sx={{ textTransform: 'none', color: 'text.primary' }}
              >
                Users
              </Button>
            </>
          )}
          <Button 
            component={Link} 
            to="/installment-plans" 
            startIcon={<AccountBalanceIcon />}
            sx={{ textTransform: 'none', color: 'text.primary' }}
          >
            Plans
          </Button>
          <Button 
            component={Link} 
            to="/installment-payments" 
            startIcon={<PaymentIcon />}
            sx={{ textTransform: 'none', color: 'text.primary' }}
          >
            Payments
          </Button>
        </Box>

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={user?.role}
            size="small"
            color={user?.role === 'Admin' ? 'primary' : 'default'}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          />
          <Tooltip title="Account menu">
            <IconButton
              onClick={handleMenu}
              size="small"
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight={600}>{user?.username}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
