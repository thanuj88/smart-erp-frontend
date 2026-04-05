import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService, categoryService, saleService, installmentSettingsService, installmentPaymentService, installmentPlanService } from '../services';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Alert,
  Stack,
  Paper,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  AttachMoney as CashIcon,
  AccountBalance as InstallmentIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

function SellItems() {
  const { t } = useTranslation();
  
  // Mode selection: 'cash', 'installment', 'payment'
  const [mode, setMode] = useState('cash');
  
  // Common states
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bill, setBill] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search states
  const [categorySearch, setCategorySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  
  // Installment sale states
  const [interestRates, setInterestRates] = useState({});
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    idCardNo: '',
    email: '',
    address: '',
    idImage: null,
  });
  const [witness, setWitness] = useState({
    name: '',
    phone: '',
    idCardNo: '',
    address: '',
    idImage: null,
  });
  const [downPayment, setDownPayment] = useState('');
  const [installmentMonths, setInstallmentMonths] = useState('3');
  
  // Installment payment states
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [planSearch, setPlanSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [mode]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (mode === 'cash' || mode === 'installment') {
        const [categoriesData, itemsData, settingsData] = await Promise.all([
          categoryService.getAll(),
          itemService.getAvailable(),
          installmentSettingsService.getAll(),
        ]);
        setCategories(categoriesData);
        setAllItems(itemsData);
        
        const rates = {};
        settingsData.forEach((setting) => {
          rates[setting.months] = setting.interest_rate;
        });
        setInterestRates(rates);
        
        if (!installmentMonths && settingsData.length > 0) {
          const sortedSettings = settingsData.sort((a, b) => a.months - b.months);
          setInstallmentMonths(sortedSettings[0].months.toString());
        }
      } else if (mode === 'payment') {
        const [plansData, paymentsData] = await Promise.all([
          installmentPlanService.getActive(),
          installmentPaymentService.getPending(),
        ]);
        setInstallmentPlans(plansData);
        setPendingPayments(paymentsData);
      }
    } catch (error) {
      setError(t('Failed to load data'));
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    try {
      const categoryItems = allItems.filter(item => item.category_id === category.id);
      setItems(categoryItems);
    } catch (error) {
      const filtered = allItems.filter(item => item.category_id === category.id);
      setItems(filtered);
    }
  };

  const addToBill = (item) => {
    const existingIndex = bill.findIndex((b) => b.id === item.id);
    
    if (existingIndex >= 0) {
      const updated = [...bill];
      if (updated[existingIndex].quantity < item.quantity) {
        updated[existingIndex].quantity++;
        updated[existingIndex].total =
          updated[existingIndex].quantity * (item.selling_price || item.price);
        setBill(updated);
      }
    } else {
      setBill([
        ...bill,
        {
          id: item.id,
          name: item.name,
          price: item.selling_price || item.price,
          quantity: 1,
          maxQuantity: item.quantity,
          total: item.selling_price || item.price,
        },
      ]);
    }
  };

  const removeFromBill = (itemId) => {
    setBill(bill.filter((item) => item.id !== itemId));
  };

  const incrementQuantity = (itemId) => {
    const updated = bill.map((item) => {
      if (item.id === itemId && item.quantity < item.maxQuantity) {
        return {
          ...item,
          quantity: item.quantity + 1,
          total: (item.quantity + 1) * item.price,
        };
      }
      return item;
    });
    setBill(updated);
  };

  const decrementQuantity = (itemId) => {
    const updated = bill.map((item) => {
      if (item.id === itemId && item.quantity > 1) {
        return {
          ...item,
          quantity: item.quantity - 1,
          total: (item.quantity - 1) * item.price,
        };
      }
      return item;
    });
    setBill(updated);
  };

  const calculateTotal = () => {
    return bill.reduce((sum, item) => sum + item.total, 0);
  };

  const clearBill = () => {
    if (bill.length > 0 && window.confirm(t('Are you sure you want to clear the entire bill?'))) {
      setBill([]);
      setError('');
      setSuccess('');
    }
  };

  const handleCashSaleCheckout = async () => {
    if (bill.length === 0) {
      setError(t('Cart is empty'));
      return;
    }

    if (!window.confirm(t('Confirm sale and process payment?'))) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const saleData = {
        items: bill.map((item) => ({
          item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.total,
        })),
        total: calculateTotal(),
        paymentType: 'cash',
      };

      await saleService.create(saleData);
      setSuccess(t('Sale completed successfully!'));
      setBill([]);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || t('Failed to complete sale'));
    } finally {
      setProcessing(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <CartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={600}>
          {t('Point of Sale')}
        </Typography>
      </Box>

      {/* Mode Selection Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={mode}
          onChange={(e, newValue) => setMode(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            icon={<CashIcon />} 
            iconPosition="start" 
            label={t('Cash Sale')} 
            value="cash" 
            sx={{ textTransform: 'none', fontWeight: 500 }} 
          />
          <Tab 
            icon={<InstallmentIcon />} 
            iconPosition="start" 
            label={t('Installment Sale')} 
            value="installment" 
            sx={{ textTransform: 'none', fontWeight: 500 }} 
          />
          <Tab 
            icon={<PaymentIcon />} 
            iconPosition="start" 
            label={t('Installment Payment')} 
            value="payment" 
            sx={{ textTransform: 'none', fontWeight: 500 }} 
          />
        </Tabs>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Cash Sale Layout */}
      {mode === 'cash' && (
        <Grid container spacing={2}>
          {/* Left: Categories */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: 'calc(100vh - 280px)', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon />
                {t('Select Category')}
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={t('Search categories...')}
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <Stack spacing={1}>
                {filteredCategories.map((category) => (
                  <Card
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: selectedCategory?.id === category.id ? 'primary.light' : 'white',
                      border: '1px solid',
                      borderColor: selectedCategory?.id === category.id ? 'primary.main' : 'divider',
                      '&:hover': { boxShadow: 2 }
                    }}
                  >
                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">{category.icon || '📦'}</Typography>
                        <Typography variant="body2" fontWeight={selectedCategory?.id === category.id ? 600 : 400}>
                          {category.name}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Middle: Items */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, height: 'calc(100vh - 280px)', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                {selectedCategory ? `${selectedCategory.icon || '📦'} ${selectedCategory.name}` : t('Items')}
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={t('Search items...')}
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              {!selectedCategory ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">{t('Select a category to view items')}</Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                    <Card key={item.id} variant="outlined">
                      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" fontWeight={500}>{item.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              ${(item.selling_price || item.price).toFixed(2)} • {item.quantity} {t('in stock')}
                            </Typography>
                          </Box>
                          <IconButton color="primary" onClick={() => addToBill(item)} size="small">
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
              {filteredItems.length > rowsPerPage && (
                <TablePagination
                  component="div"
                  count={filteredItems.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              )}
            </Paper>
          </Grid>

          {/* Right: Current Bill */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CartIcon />
                {t('Current Bill')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {bill.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <CartIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">{t('No items in bill')}</Typography>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ flex: 1, mb: 2, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ py: 1 }}>Item</TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>Qty</TableCell>
                          <TableCell align="right" sx={{ py: 1 }}>Total</TableCell>
                          <TableCell align="center" sx={{ py: 1, width: 50 }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bill.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell sx={{ py: 1 }}>
                              <Typography variant="body2">{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ${item.price.toFixed(2)} each
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <IconButton size="small" onClick={() => decrementQuantity(item.id)} disabled={item.quantity <= 1}>
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton size="small" onClick={() => incrementQuantity(item.id)} disabled={item.quantity >= item.maxQuantity}>
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                ${item.total.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1 }}>
                              <IconButton size="small" color="error" onClick={() => removeFromBill(item.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={600}>
                        ${calculateTotal().toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handleCashSaleCheckout}
                      disabled={processing}
                      startIcon={<CashIcon />}
                      sx={{ py: 1.5 }}
                    >
                      {processing ? t('Processing...') : t('Complete Sale')}
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      color="error"
                      onClick={clearBill}
                      startIcon={<DeleteIcon />}
                    >
                      {t('Clear Bill')}
                    </Button>
                  </Stack>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Installment and Payment modes - Keep existing structure for now */}
      {mode === 'installment' && (
        <Typography>Installment Sale Mode (To be updated)</Typography>
      )}
      {mode === 'payment' && (
        <Typography>Installment Payment Mode (To be updated)</Typography>
      )}
    </Box>
  );
}

export default SellItems;
