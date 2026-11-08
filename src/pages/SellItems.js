import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  itemService,
  categoryService,
  saleService,
  installmentSettingsService,
  installmentPaymentService,
  installmentPlanService,
  promotionService,
  customerService,
} from '../services';
import CategoryIcon from '../components/CategoryIcon';
import ProductThumbnail from '../components/ProductThumbnail';
import { resolveCategoryIconKey } from '../config/categoryIcons';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { usePosSaleGuard } from '../contexts/PosSaleGuardContext';
import {
  validateDistinctCustomerAndWitness,
  getInstallmentFieldErrors,
  getInstallmentValidationMessage,
  getCustomerWitnessDuplicates,
  isValidNic,
  looksLikeNic,
  normalizeNic,
  sanitizeNicInput,
} from '../utils/installmentValidation';
import { generateOrderId, formatOrderId, generateCheckoutKey, billFingerprint } from '../utils/orderId';
import { sanitizeLocalPhoneInput } from '../utils/phone';
import { billToReceiptItems, mergeReceipt, getReceiptPaperSize, receiptPrintPageSize, createInstallmentReceiptPrintJob, createReturnReceiptPrintJob } from '../utils/receipt';
import { applyPromotionPrice, roundMoney } from '../utils/promotions';
import { resolveBusinessName } from '../config/app';
import ReceiptPrintLayer from '../components/ReceiptPrintLayer';
import './SellItems.css';

const HOLD_KEY_PREFIX = 'pos-held-order';
const LEGACY_HOLD_KEY = 'pos-held-order';

function holdStorageKey(userId) {
  return `${HOLD_KEY_PREFIX}:${userId}`;
}

function readHeldOrder(userId) {
  if (userId == null || userId === '') return null;
  try {
    const raw = localStorage.getItem(holdStorageKey(userId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.bill?.length) return null;
    if (data.userId != null && String(data.userId) !== String(userId)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeHeldOrder(userId, data) {
  if (userId == null || userId === '') return;
  localStorage.setItem(holdStorageKey(userId), JSON.stringify({ ...data, userId }));
}

function clearHeldOrder(userId) {
  if (userId == null || userId === '') return;
  localStorage.removeItem(holdStorageKey(userId));
}

/** Fallback when tenant has no installment settings configured yet */
const DEFAULT_INSTALLMENT_PERIODS = [
  { months: 3, interest_rate: 0 },
  { months: 6, interest_rate: 0 },
  { months: 12, interest_rate: 0 },
];

const getItemCategoryIcon = (item, categories) =>
  resolveCategoryIconKey(item.category_icon, categories, item.category_id);

const formatTimer = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

function SellItems() {
  const { t } = useTranslation();
  const { formatMoney, currency, settings } = useCurrency();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { setSaleGuard } = usePosSaleGuard();

  const [mode, setMode] = useState('cash');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bill, setBill] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [installmentModalError, setInstallmentModalError] = useState('');
  const [installmentTouched, setInstallmentTouched] = useState(false);
  const [success, setSuccess] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [orderRef, setOrderRef] = useState(() => generateOrderId());
  const [checkoutKey, setCheckoutKey] = useState(() => generateCheckoutKey());
  const [elapsed, setElapsed] = useState(0);
  const [orderStartedAt, setOrderStartedAt] = useState(null);
  const [walkInCustomer, setWalkInCustomer] = useState('Walk in Customer');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberCustomer, setMemberCustomer] = useState(null);
  const [memberLookupStatus, setMemberLookupStatus] = useState('idle');

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
  const [includeWitness, setIncludeWitness] = useState(false);
  const [downPayment, setDownPayment] = useState('');
  const [installmentMonths, setInstallmentMonths] = useState('3');
  const [shipping, setShipping] = useState('');
  const [shippingPercent, setShippingPercent] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [activePromotions, setActivePromotions] = useState([]);

  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [printJob, setPrintJob] = useState(null);
  const [hasHeldBill, setHasHeldBill] = useState(false);
  const [openedHold, setOpenedHold] = useState(false);
  const [returnSearch, setReturnSearch] = useState('');
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnQtys, setReturnQtys] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [returnType, setReturnType] = useState('cash');
  const openedHoldRef = React.useRef(false);
  openedHoldRef.current = openedHold;

  useEffect(() => {
    if (!showInstallmentModal) return undefined;
    document.documentElement.classList.add('pos-installment-modal-open');
    document.body.classList.add('pos-installment-modal-open');
    return () => {
      document.documentElement.classList.remove('pos-installment-modal-open');
      document.body.classList.remove('pos-installment-modal-open');
    };
  }, [showInstallmentModal]);

  useEffect(() => {
    if (bill.length === 0) {
      setOrderStartedAt(null);
      setElapsed(0);
      return undefined;
    }
    if (!orderStartedAt) {
      setOrderStartedAt(Date.now());
      setElapsed(0);
      return undefined;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - orderStartedAt) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [bill.length, orderStartedAt]);

  // A new order id and checkout key are minted only after a sale fully succeeds (or the bill is cleared/held).
  const newOrderRef = () => {
    setOrderRef(generateOrderId());
    setCheckoutKey(generateCheckoutKey());
  };

  const saleStateRef = React.useRef({});
  saleStateRef.current = {
    bill,
    mode,
    customer,
    witness,
    includeWitness,
    downPayment,
    installmentMonths,
    walkInCustomer,
    memberPhone,
    memberCustomer,
    shipping,
    shippingPercent,
    discount,
    discountPercent,
    orderRef,
    orderStartedAt,
    userId: user?.id,
  };

  useEffect(() => {
    localStorage.removeItem(LEGACY_HOLD_KEY);
  }, []);

  useEffect(() => {
    setHasHeldBill(Boolean(readHeldOrder(user?.id)));
    setOpenedHold(false);
  }, [user?.id]);

  const countryCode = settings?.countryCode;

  useEffect(() => {
    const phone = memberPhone.trim();
    const digits = memberPhone.replace(/\D/g, '');
    if (!phone || digits.length < 7) {
      setMemberCustomer(null);
      setMemberLookupStatus('idle');
      setWalkInCustomer('Walk in Customer');
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setMemberLookupStatus('loading');
      try {
        const found = await customerService.lookupByPhone(phone);
        if (cancelled) return;
        setMemberCustomer(found);
        setMemberLookupStatus('matched');
        setWalkInCustomer(found.name || 'Walk in Customer');
        setCustomer((prev) => ({
          ...prev,
          name: found.name || prev.name,
          phone: found.phone || phone,
          idCardNo: found.id_card_no || prev.idCardNo,
          email: found.email || prev.email,
          address: found.address || prev.address,
        }));
      } catch (err) {
        if (cancelled) return;
        setMemberCustomer(null);
        setMemberLookupStatus(err.response?.status === 404 ? 'none' : 'idle');
        setWalkInCustomer('Walk in Customer');
        setCustomer((prev) => ({ ...prev, phone }));
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [memberPhone]);

  const memberOverdue = memberCustomer?.overdue;
  const hasMemberOverdue = Number(memberOverdue?.count) > 0;

  const confirmBilling = (title, message, confirmLabel) => {
    const warning = hasMemberOverdue
      ? t('memberOverdueWarning', {
          name: memberCustomer?.name || memberCustomer?.phone || t('memberCustomer'),
          count: memberOverdue.count,
          amount: formatMoney(memberOverdue.amount),
        })
      : '';
    return confirm({
      title: hasMemberOverdue ? t('overdueBeforeBillingTitle') : title,
      message: warning ? `${warning}\n\n${message}` : message,
      confirmLabel,
      cancelLabel: t('Cancel'),
      variant: hasMemberOverdue ? 'warning' : 'primary',
    });
  };

  const resetBillCharges = useCallback(() => {
    setShipping('');
    setShippingPercent('');
    setDiscount('');
    setDiscountPercent('');
  }, []);

  const voidBillNow = useCallback(() => {
    setBill([]);
    setCustomer({ name: '', phone: '', idCardNo: '', email: '', address: '', idImage: null });
    setWitness({ name: '', phone: '', idCardNo: '', address: '', idImage: null });
    setIncludeWitness(false);
    setDownPayment('');
    setMemberPhone('');
    setMemberCustomer(null);
    setMemberLookupStatus('idle');
    resetBillCharges();
    setShowInstallmentModal(false);
    setOpenedHold(false);
    newOrderRef();
  }, [resetBillCharges]);

  const holdBillNow = useCallback(() => {
    const sale = saleStateRef.current;
    if (!sale.bill?.length) return false;
    writeHeldOrder(sale.userId, {
      bill: sale.bill,
      mode: sale.mode,
      customer: sale.customer,
      witness: sale.witness,
      includeWitness: sale.includeWitness,
      downPayment: sale.downPayment,
      installmentMonths: sale.installmentMonths,
      walkInCustomer: sale.walkInCustomer,
      memberPhone: sale.memberPhone,
      memberCustomer: sale.memberCustomer,
      shipping: sale.shipping,
      shippingPercent: sale.shippingPercent,
      discount: sale.discount,
      discountPercent: sale.discountPercent,
      orderRef: sale.orderRef,
      orderStartedAt: sale.orderStartedAt,
    });
    setHasHeldBill(true);
    setOpenedHold(false);
    setBill([]);
    resetBillCharges();
    setShowInstallmentModal(false);
    newOrderRef();
    return true;
  }, [resetBillCharges]);

  const applyHeldOrder = useCallback((data) => {
    setBill(data.bill || []);
    if (data.mode) setMode(data.mode);
    if (data.customer) setCustomer(data.customer);
    if (data.witness) setWitness(data.witness);
    if (typeof data.includeWitness === 'boolean') setIncludeWitness(data.includeWitness);
    if (data.downPayment != null) setDownPayment(data.downPayment);
    if (data.installmentMonths) setInstallmentMonths(data.installmentMonths);
    if (data.walkInCustomer) setWalkInCustomer(data.walkInCustomer);
    if (data.memberPhone != null) setMemberPhone(data.memberPhone);
    if (data.memberCustomer) setMemberCustomer(data.memberCustomer);
    else setMemberCustomer(null);
    setShipping(data.shipping != null ? String(data.shipping) : '');
    setShippingPercent(data.shippingPercent != null ? String(data.shippingPercent) : '');
    setDiscount(data.discount != null ? String(data.discount) : '');
    setDiscountPercent(data.discountPercent != null ? String(data.discountPercent) : '');
    if (data.orderRef) setOrderRef(data.orderRef);
    if (data.orderStartedAt) {
      setOrderStartedAt(data.orderStartedAt);
      setElapsed(Math.max(0, Math.floor((Date.now() - data.orderStartedAt) / 1000)));
    }
    setOpenedHold(true);
  }, []);

  const releaseOpenedHoldIfNeeded = useCallback(() => {
    if (!openedHoldRef.current) return;
    clearHeldOrder(saleStateRef.current.userId);
    setHasHeldBill(false);
    setOpenedHold(false);
  }, []);

  useEffect(() => {
    return setSaleGuard({
      hasOpenSale: () => saleStateRef.current.bill.length > 0,
      hold: holdBillNow,
      voidSale: voidBillNow,
    });
  }, [holdBillNow, setSaleGuard, voidBillNow]);

  useEffect(() => {
    if (bill.length === 0) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [bill.length]);

  const printSaleReceipt = useCallback(
    (billItems, extras = {}) => {
      const template = mergeReceipt(settings?.receipt, settings?.receiptFooter);
      const paper = getReceiptPaperSize(template.paperSize);
      const charged = billItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
      setPrintJob({
        pageSize: receiptPrintPageSize(paper),
        preview: {
          businessName: resolveBusinessName(settings),
          currency,
          taxRate: 0,
          receipt: template,
          items: billToReceiptItems(billItems, currency),
          cashierName: user?.full_name || user?.fullName || user?.username || 'CASHIER',
          saleNumber: String(orderRef || '').replace(/^#/, '') || `S${Date.now()}`,
          soldAt: new Date().toISOString(),
          subtotal: charged,
          tax: 0,
          total: extras.total != null ? extras.total : charged,
          tendered: extras.tendered != null ? extras.tendered : charged,
          change: extras.change != null ? extras.change : 0,
          tenderedLabel: extras.tenderedLabel || 'Tendered Cash',
          extraTotalLines: extras.extraTotalLines || [],
          adjustmentLines: extras.adjustmentLines || [],
          showChange: extras.showChange !== false,
        },
      });
    },
    [currency, orderRef, settings, user]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      if (mode === 'cash' || mode === 'installment') {
        const [categoriesData, itemsData, settingsData, promotionsData] = await Promise.all([
          categoryService.getAll(),
          itemService.getAvailable(),
          installmentSettingsService.getAll(),
          promotionService.getActive().catch(() => []),
        ]);
        setCategories(categoriesData);
        setAllItems(itemsData);
        setItems(itemsData);
        setActivePromotions(promotionsData || []);

        const rates = {};
        (settingsData || []).forEach((setting) => {
          if (setting?.months != null) {
            rates[String(setting.months)] = Number(setting.interest_rate) || 0;
          }
        });
        setInterestRates(rates);
      } else if (mode === 'payment') {
        const [plansData, paymentsData] = await Promise.all([
          installmentPlanService.getActive(),
          installmentPaymentService.getPending(),
        ]);
        setInstallmentPlans(plansData);
        setPendingPayments(paymentsData);
      }
    } catch (err) {
      setError(t('posFailedToLoad'));
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [mode, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const installmentPeriodOptions = useMemo(() => {
    const keys = Object.keys(interestRates).sort((a, b) => Number(a) - Number(b));
    if (keys.length > 0) {
      return keys.map((months) => ({
        months,
        interest_rate: interestRates[months],
      }));
    }
    return DEFAULT_INSTALLMENT_PERIODS.map((opt) => ({
      months: String(opt.months),
      interest_rate: opt.interest_rate,
    }));
  }, [interestRates]);

  useEffect(() => {
    const available = installmentPeriodOptions.map((opt) => opt.months);
    if (available.length > 0 && !available.includes(installmentMonths)) {
      setInstallmentMonths(available[0]);
    }
  }, [installmentPeriodOptions, installmentMonths]);

  const handleCategorySelect = async (category) => {
    if (!category) {
      setSelectedCategory(null);
      setItems(allItems);
      return;
    }
    setSelectedCategory(category);
    try {
      const categoryItems = await itemService.getByCategory(category.id);
      setItems(categoryItems);
    } catch {
      setItems(allItems.filter((item) => item.category_id === category.id));
    }
  };

  const displayItems = useMemo(() => {
    if (mode === 'payment') return [];
    const source =
      mode === 'cash'
        ? selectedCategory
          ? allItems.filter((i) => i.category_id === selectedCategory.id)
          : allItems
        : items;
    if (!itemSearch.trim()) return source;
    return source.filter((item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [mode, allItems, items, selectedCategory, itemSearch]);

  const filteredPlans = installmentPlans.filter(
    (plan) =>
      plan.customer_name.toLowerCase().includes(planSearch.toLowerCase()) ||
      (plan.customer_id_card &&
        plan.customer_id_card.toLowerCase().includes(planSearch.toLowerCase()))
  );

  const addToBill = (item) => {
    const existingIndex = bill.findIndex((billItem) => billItem.id === item.id);
    const { price, listPrice, promotion } = applyPromotionPrice(item, activePromotions);

    if (existingIndex !== -1) {
      const newBill = [...bill];
      if (newBill[existingIndex].quantity < item.quantity) {
        newBill[existingIndex].quantity += 1;
          newBill[existingIndex].total = roundMoney(
            newBill[existingIndex].quantity * newBill[existingIndex].price
          );
        setBill(newBill);
      } else {
        setError(t('posStockLimit'));
        setTimeout(() => setError(''), 2000);
      }
    } else {
      setBill([
        ...bill,
        {
          id: item.id,
          name: item.name,
          price,
          listPrice,
          promotionPercent: promotion?.percent || 0,
          quantity: 1,
          maxQuantity: item.quantity,
          total: roundMoney(price),
          categoryIcon: getItemCategoryIcon(item, categories),
          category_id: item.category_id,
          category_icon: item.category_icon,
          image_path: item.image_path,
        },
      ]);
    }
  };

  const incrementQuantity = (itemId) => {
    setBill((currentBill) =>
      currentBill.map((item) => {
        if (item.id === itemId && item.quantity < item.maxQuantity) {
          const quantity = item.quantity + 1;
          return { ...item, quantity, total: roundMoney(quantity * item.price) };
        }
        return item;
      })
    );
  };

  const decrementQuantity = (itemId) => {
    setBill((currentBill) => {
      const target = currentBill.find((item) => item.id === itemId);
      if (!target) return currentBill;
      if (target.quantity <= 1) {
        return currentBill.filter((item) => item.id !== itemId);
      }
      return currentBill.map((item) => {
        if (item.id === itemId) {
          const quantity = item.quantity - 1;
          return { ...item, quantity, total: roundMoney(quantity * item.price) };
        }
        return item;
      });
    });
  };

  const removeFromBill = (itemId) => {
    setBill((currentBill) => currentBill.filter((item) => item.id !== itemId));
  };

  const handleProductQty = (item, delta, e) => {
    e?.stopPropagation();
    const inBill = bill.find((b) => b.id === item.id);
    if (delta > 0) {
      if (inBill) incrementQuantity(item.id);
      else addToBill(item);
    } else if (inBill) {
      if (inBill.quantity <= 1) removeFromBill(item.id);
      else decrementQuantity(item.id);
    }
  };

  const clearBill = async () => {
    if (bill.length === 0) return;
    const ok = await confirm({
      title: t('posClearBill'),
      message: t('posClearBillConfirm'),
      confirmLabel: t('clear'),
      cancelLabel: t('Cancel'),
      variant: 'warning',
      icon: 'bi-trash3',
    });
    if (!ok) return;
    voidBillNow();
  };

  const parseBillAmount = (value) => {
    const n = parseFloat(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const parseBillPercent = (value) => {
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(n, 100);
  };


  const calculateItemsTotal = () =>
    roundMoney(bill.reduce((sum, item) => sum + roundMoney(Number(item.total || 0)), 0));

  const calculateCharges = () => {
    const itemsTotal = calculateItemsTotal();
    const shippingPct = parseBillPercent(shippingPercent);
    const discountPct = parseBillPercent(discountPercent);
    const shippingAmount = roundMoney(
      parseBillAmount(shipping) + itemsTotal * (shippingPct / 100)
    );
    const maxDiscount = itemsTotal + shippingAmount;
    const discountAmount = roundMoney(
      Math.min(parseBillAmount(discount) + itemsTotal * (discountPct / 100), maxDiscount)
    );
    const grandTotal = roundMoney(Math.max(0, itemsTotal + shippingAmount - discountAmount));
    return { itemsTotal, shippingAmount, shippingPct, discountAmount, discountPct, grandTotal };
  };

  const getAdjustmentLines = (charges = calculateCharges()) => {
    const lines = [];
    if (charges.shippingAmount > 0) {
      lines.push({
        label: charges.shippingPct > 0 ? `Shipping (${charges.shippingPct}%)` : 'Shipping',
        value: charges.shippingAmount,
      });
    }
    if (charges.discountAmount > 0) {
      lines.push({
        label: charges.discountPct > 0 ? `Discount (${charges.discountPct}%)` : 'Discount',
        value: charges.discountAmount,
        negative: true,
      });
    }
    return lines;
  };

  const calculateTotal = () => calculateCharges().grandTotal;

  const calculateInstallmentPreview = () => {
    const total = calculateTotal();
    const down = parseFloat(downPayment) || 0;
    const remaining = total - down;
    const selectedPeriod = installmentPeriodOptions.find((opt) => opt.months === installmentMonths);
    const rate = selectedPeriod?.interest_rate ?? 0;
    const interestAmount = (remaining * rate) / 100;
    const totalWithInterest = remaining + interestAmount;
    const months = parseInt(installmentMonths, 10) || 1;
    const monthlyPayment = totalWithInterest / months;
    return {
      total,
      downPayment: down,
      remaining,
      interestRate: rate,
      interestAmount,
      totalWithInterest,
      monthlyPayment,
    };
  };

  const openInstallmentModal = () => {
    if (bill.length === 0) {
      setError(t('posAddItemsFirst'));
      setTimeout(() => setError(''), 3000);
      return;
    }
    setError('');
    setInstallmentModalError('');
    setInstallmentTouched(false);
    if (memberPhone.trim() && !customer.phone) {
      setCustomer((prev) => ({ ...prev, phone: memberPhone.trim() }));
    }
    setShowInstallmentModal(true);
  };

  const closeInstallmentModal = () => {
    setShowInstallmentModal(false);
    setInstallmentModalError('');
    setInstallmentTouched(false);
  };

  const showInstallmentModalError = (message, autoClearMs = 0) => {
    setInstallmentModalError(message);
    if (autoClearMs > 0) {
      setTimeout(() => setInstallmentModalError(''), autoClearMs);
    }
  };

  const handleImageCapture = (field, type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === 'customer') {
            setCustomer((prev) => ({ ...prev, [field]: reader.result }));
          } else {
            setWitness((prev) => ({ ...prev, [field]: reader.result }));
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const checkoutCharges = () => ({
    shipping: parseBillAmount(shipping) || undefined,
    shippingPercent: parseBillPercent(shippingPercent) || undefined,
    discount: parseBillAmount(discount) || undefined,
    discountPercent: parseBillPercent(discountPercent) || undefined,
  });

  const handleCashSaleCheckout = async () => {
    if (bill.length === 0) {
      setError(t('posAddItemsFirst'));
      setTimeout(() => setError(''), 3000);
      return;
    }
    const ok = await confirmBilling(
      t('posConfirmSale'),
      t('posConfirmSaleMessage'),
      t('posProcessPayment')
    );
    if (!ok) return;

    try {
      setProcessing(true);
      setError('');
      // One request for the whole bill: all lines are booked together or not at all.
      const lines = bill.map((item) => ({ itemId: item.id, quantity: item.quantity }));
      const chargesInput = checkoutCharges();
      const result = await saleService.processCashSale({
        lines,
        orderNumber: orderRef,
        idempotencyKey: `${checkoutKey}-${billFingerprint(lines, chargesInput)}`,
        customerPhone: memberCustomer ? memberPhone : undefined,
        ...chargesInput,
      });
      const charges = calculateCharges();
      const bookedTotal = result?.total != null ? result.total : charges.grandTotal;
      printSaleReceipt(bill, {
        total: bookedTotal,
        tendered: bookedTotal,
        adjustmentLines: getAdjustmentLines(charges),
      });
      setSuccess(t('posSaleCompleted'));
      setBill([]);
      resetBillCharges();
      setMemberPhone('');
      setMemberCustomer(null);
      setMemberLookupStatus('idle');
      setWalkInCustomer('Walk in Customer');
      releaseOpenedHoldIfNeeded();
      newOrderRef();
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || t('posSaleFailed'));
    } finally {
      setProcessing(false);
    }
  };

  const handleInstallmentSaleCheckout = async () => {
    if (bill.length === 0) {
      showInstallmentModalError('Add items to bill', 3000);
      return;
    }

    setInstallmentTouched(true);
    const orderTotal = calculateTotal();
    const normalizedCustomer = { ...customer, idCardNo: normalizeNic(customer.idCardNo) };
    const normalizedWitness = includeWitness
      ? { ...witness, idCardNo: normalizeNic(witness.idCardNo) }
      : { name: '', phone: '', idCardNo: '', address: '', idImage: null };
    setCustomer(normalizedCustomer);
    if (includeWitness) setWitness(normalizedWitness);

    const fieldErrors = getInstallmentFieldErrors(
      normalizedCustomer,
      normalizedWitness,
      downPayment,
      orderTotal,
      { includeWitness }
    );
    if (Object.keys(fieldErrors).length > 0) {
      const message = getInstallmentValidationMessage(
        fieldErrors,
        normalizedCustomer,
        normalizedWitness,
        downPayment,
        orderTotal,
        { includeWitness }
      );
      showInstallmentModalError(message, 4000);
      return;
    }

    const ok = await confirmBilling(
      t('posConfirmInstallment'),
      t('posConfirmInstallmentMessage'),
      t('posCreateInstallment')
    );
    if (!ok) return;

    try {
      setProcessing(true);
      setInstallmentModalError('');
      const chargesInput = checkoutCharges();
      const result = await saleService.processInstallmentSale({
        lines: bill.map((item) => ({ itemId: item.id, quantity: item.quantity })),
        customer: normalizedCustomer,
        includeWitness,
        witness: includeWitness ? normalizedWitness : null,
        downPayment: parseFloat(downPayment),
        installmentMonths: parseInt(installmentMonths, 10),
        orderNumber: orderRef,
        ...chargesInput,
      });
      const preview = calculateInstallmentPreview();
      const bookedTotal = result?.total != null ? result.total : preview.total;
      printSaleReceipt(bill, {
        total: bookedTotal,
        tendered: preview.downPayment,
        tenderedLabel: 'Down payment',
        showChange: false,
        adjustmentLines: getAdjustmentLines(),
        extraTotalLines: [
          { label: 'Balance', value: preview.remaining },
          { label: `${preview.interestRate}% interest`, value: preview.interestAmount },
          { label: `${installmentMonths} monthly`, value: preview.monthlyPayment },
        ],
      });
      setSuccess(t('posInstallmentCreated'));
      setBill([]);
      setCustomer({ name: '', phone: '', idCardNo: '', email: '', address: '', idImage: null });
      setWitness({ name: '', phone: '', idCardNo: '', address: '', idImage: null });
      setIncludeWitness(false);
      setDownPayment('');
      setMemberPhone('');
      setMemberCustomer(null);
      setMemberLookupStatus('idle');
      setWalkInCustomer('Walk in Customer');
      resetBillCharges();
      setShowInstallmentModal(false);
      setInstallmentModalError('');
      setInstallmentTouched(false);
      releaseOpenedHoldIfNeeded();
      newOrderRef();
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setInstallmentModalError(err.response?.data?.error || 'Failed to process installment sale');
    } finally {
      setProcessing(false);
    }
  };

  const handleInstallmentPayment = async () => {
    if (!selectedPlan || !paymentAmount) {
      setError(t('posSelectPlanAndAmount'));
      setTimeout(() => setError(''), 3000);
      return;
    }
    const ok = await confirm({
      title: t('confirmPayment'),
      message: t('posConfirmPaymentMessage'),
      confirmLabel: t('recordPayment'),
      cancelLabel: t('Cancel'),
      variant: 'primary',
      icon: 'bi-credit-card',
    });
    if (!ok) return;

    try {
      setProcessing(true);
      setError('');
      const planPayments = pendingPayments.filter((p) => p.installment_plan_id === selectedPlan.id);
      if (planPayments.length === 0) {
        setError(t('posNoPendingPayments'));
        return;
      }
      const nextPayment = planPayments.sort((a, b) => a.payment_number - b.payment_number)[0];
      await installmentPaymentService.recordPayment(
        nextPayment.id,
        parseFloat(paymentAmount),
        paymentNotes
      );
      try {
        const plan = await installmentPlanService.getById(selectedPlan.id);
        setPrintJob(
          createInstallmentReceiptPrintJob({
            settings,
            currency,
            cashierName: user?.full_name || user?.fullName || user?.username || 'CASHIER',
            plan,
            currentAmount: parseFloat(paymentAmount),
          })
        );
      } catch {
        // Sale still recorded if receipt print fails.
      }
      setSuccess(t('posPaymentRecorded'));
      setSelectedPlan(null);
      setPaymentAmount('');
      setPaymentNotes('');
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleHold = () => {
    if (!holdBillNow()) {
      setError(t('posNoItemsToHold'));
      setTimeout(() => setError(''), 2000);
      return;
    }
    setSuccess(t('orderHeldNewBill'));
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleOpenHold = async () => {
    const data = readHeldOrder(user?.id);
    if (!data) {
      setHasHeldBill(false);
      setError(t('noHeldBill'));
      setTimeout(() => setError(''), 2000);
      return;
    }
    if (openedHold && bill.length > 0) {
      setSuccess(t('heldBillAlreadyOpen'));
      setTimeout(() => setSuccess(''), 2000);
      return;
    }
    if (bill.length > 0) {
      const ok = await confirm({
        title: t('openHoldBill'),
        message: t('openHoldBillReplaceCurrent'),
        confirmLabel: t('openHoldBill'),
        cancelLabel: t('Cancel'),
        variant: 'warning',
        icon: 'bi-bag-check',
      });
      if (!ok) return;
    }
    applyHeldOrder(data);
    setSuccess(t('heldBillOpened'));
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteHold = async () => {
    if (!readHeldOrder(user?.id) && !hasHeldBill) return;
    const ok = await confirm({
      title: t('deleteHoldBill'),
      message: t('deleteHoldBillConfirm'),
      confirmLabel: t('Delete'),
      cancelLabel: t('Cancel'),
      variant: 'danger',
      icon: 'bi-trash3',
    });
    if (!ok) return;
    const clearOpenOrder = openedHold || openedHoldRef.current;
    clearHeldOrder(user?.id);
    setHasHeldBill(false);
    if (clearOpenOrder) {
      voidBillNow();
    } else {
      setOpenedHold(false);
    }
    setSuccess(t('heldBillDeleted'));
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleLookupReturn = async () => {
    const query = returnSearch.trim();
    if (!query) {
      setError(t('Enter an order number'));
      setTimeout(() => setError(''), 2500);
      return;
    }
    try {
      setProcessing(true);
      setError('');
      const order = await saleService.getOrder(query);
      setReturnOrder(order);
      const nextQty = {};
      (order.lines || []).forEach((line) => {
        nextQty[line.id] = 0;
      });
      setReturnQtys(nextQty);
    } catch (err) {
      setReturnOrder(null);
      setReturnQtys({});
      setError(err.response?.data?.error || t('Order not found'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const setReturnLineQty = (saleId, nextQty, maxQty) => {
    const qty = Math.max(0, Math.min(maxQty, Number(nextQty) || 0));
    setReturnQtys((prev) => ({ ...prev, [saleId]: qty }));
  };

  const selectedReturnLines = useMemo(() => {
    if (!returnOrder?.lines) return [];
    return returnOrder.lines
      .map((line) => ({
        ...line,
        returnQty: Number(returnQtys[line.id]) || 0,
      }))
      .filter((line) => line.returnQty > 0);
  }, [returnOrder, returnQtys]);

  const returnPreview = useMemo(() => {
    const refundValue = selectedReturnLines.reduce(
      (sum, line) => sum + line.returnQty * Number(line.unit_price || 0),
      0
    );
    if (!returnOrder || selectedReturnLines.length === 0) {
      return { refundValue: 0, refundCash: 0, unpaidAfter: null, fullReturn: false, replacementQty: 0 };
    }
    const remainingAfter = (returnOrder.lines || []).map((line) => {
      const qty = Number(returnQtys[line.id]) || 0;
      return (line.returnable_qty || 0) - qty;
    });
    const fullReturn = remainingAfter.every((qty) => qty <= 0);
    const replacementQty = returnType === 'warranty'
      ? selectedReturnLines.reduce((sum, line) => sum + line.returnQty, 0)
      : 0;
    if (returnType !== 'cash') {
      return { refundValue, refundCash: 0, unpaidAfter: null, fullReturn, replacementQty };
    }
    if (returnOrder.payment_type !== 'installment' || !returnOrder.plan) {
      return { refundValue, refundCash: refundValue, unpaidAfter: null, fullReturn, replacementQty };
    }
    const plan = returnOrder.plan;
    const unpaid = Math.max(0, Number(plan.total_with_interest || 0) - Number(plan.paid_amount || 0));
    if (fullReturn) {
      return {
        refundValue,
        refundCash: Number(plan.down_payment || 0) + Number(plan.paid_amount || 0),
        unpaidAfter: 0,
        fullReturn,
        replacementQty,
      };
    }
    if (refundValue <= unpaid) {
      return { refundValue, refundCash: 0, unpaidAfter: unpaid - refundValue, fullReturn, replacementQty };
    }
    return { refundValue, refundCash: refundValue - unpaid, unpaidAfter: 0, fullReturn, replacementQty };
  }, [returnOrder, returnQtys, returnType, selectedReturnLines]);

  const handleProcessReturn = async () => {
    if (!returnOrder || selectedReturnLines.length === 0) {
      setError(t('Select items to return'));
      setTimeout(() => setError(''), 2500);
      return;
    }
    const confirmMessage =
      returnType === 'warranty'
        ? t('posWarrantyConfirm')
        : returnType === 'defect'
          ? t('posDefectConfirm')
          : t('posCashReturnConfirm');
    const ok = await confirm({
      title: t('Confirm return'),
      message: confirmMessage,
      confirmLabel: t('Process return'),
      cancelLabel: t('Cancel'),
      variant: 'warning',
      icon: 'bi-arrow-counterclockwise',
    });
    if (!ok) return;
    try {
      setProcessing(true);
      setError('');
      const result = await saleService.createReturn({
        orderNumber: returnOrder.order_number,
        returnType,
        reason: returnReason,
        lines: selectedReturnLines.map((line) => ({
          saleId: line.id,
          quantity: line.returnQty,
        })),
      });
      setPrintJob(
        createReturnReceiptPrintJob({
          settings,
          currency,
          cashierName: user?.full_name || user?.fullName || user?.username || 'CASHIER',
          result,
        })
      );
      setSuccess(t('Return processed'));
      setReturnOrder(result.order || null);
      const nextQty = {};
      (result.order?.lines || []).forEach((line) => {
        nextQty[line.id] = 0;
      });
      setReturnQtys(nextQty);
      setReturnReason('');
      setReturnType('cash');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to process return'));
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentAction = () => {
    if (mode === 'cash') handleCashSaleCheckout();
    else if (mode === 'installment') openInstallmentModal();
    else if (mode === 'return') handleProcessReturn();
    else handleInstallmentPayment();
  };

  const total = calculateTotal();
  const installmentPreview = downPayment ? calculateInstallmentPreview() : null;
  const witnessDuplicateError = useMemo(
    () => (includeWitness ? validateDistinctCustomerAndWitness(customer, witness) : null),
    [includeWitness, customer, witness]
  );

  const highlightedInstallmentFields = useMemo(() => {
    const errors = installmentTouched
      ? getInstallmentFieldErrors(customer, witness, downPayment, total, { includeWitness })
      : {};

    if (looksLikeNic(customer.idCardNo) && !isValidNic(customer.idCardNo)) {
      errors['customer.idCardNo'] = true;
    }
    if (includeWitness && normalizeNic(witness.idCardNo) && !isValidNic(witness.idCardNo)) {
      errors['witness.idCardNo'] = true;
    }

    if (includeWitness) {
      getCustomerWitnessDuplicates(customer, witness).forEach((dup) => {
        if (dup === 'name') {
          errors['customer.name'] = true;
          errors['witness.name'] = true;
        }
        if (dup === 'phone') {
          errors['customer.phone'] = true;
          errors['witness.phone'] = true;
        }
        if (dup === 'id') {
          errors['customer.idCardNo'] = true;
          errors['witness.idCardNo'] = true;
        }
      });
    }

    return errors;
  }, [installmentTouched, includeWitness, customer, witness, downPayment, total]);

  const isInstallmentFieldInvalid = (fieldKey) => Boolean(highlightedInstallmentFields[fieldKey]);
  const installmentControlClass = (fieldKey) =>
    `form-control${isInstallmentFieldInvalid(fieldKey) ? ' is-invalid' : ''}`;

  const getInstallmentFieldMessage = (fieldKey, requiredMessage, duplicateMessage, formatMessage) => {
    if (!isInstallmentFieldInvalid(fieldKey)) return null;
    const duplicates = includeWitness ? getCustomerWitnessDuplicates(customer, witness) : [];

    if (fieldKey === 'downPayment') {
      const down = parseFloat(downPayment);
      if (String(downPayment ?? '').trim() && !Number.isNaN(down) && down >= total) {
        return duplicateMessage;
      }
      return requiredMessage;
    }

    const duplicateActive =
      ((fieldKey === 'customer.name' || fieldKey === 'witness.name') && duplicates.includes('name')) ||
      ((fieldKey === 'customer.phone' || fieldKey === 'witness.phone') && duplicates.includes('phone')) ||
      ((fieldKey === 'customer.idCardNo' || fieldKey === 'witness.idCardNo') && duplicates.includes('id'));

    if (duplicateActive) return duplicateMessage;

    if (
      (fieldKey === 'customer.idCardNo' || fieldKey === 'witness.idCardNo') &&
      formatMessage &&
      String(
        fieldKey === 'customer.idCardNo' ? customer.idCardNo : witness.idCardNo
      ).trim() &&
      !isValidNic(fieldKey === 'customer.idCardNo' ? customer.idCardNo : witness.idCardNo)
    ) {
      return formatMessage;
    }

    return requiredMessage;
  };

  const installmentFieldFeedback = (fieldKey, requiredMessage, duplicateMessage, formatMessage) => {
    const message = getInstallmentFieldMessage(
      fieldKey,
      requiredMessage,
      duplicateMessage,
      formatMessage
    );
    if (!message) return null;
    return <div className="invalid-feedback d-block">{message}</div>;
  };

  const renderInstallmentModal = () => {
    if (!showInstallmentModal) return null;

    return (
      <div
        className="modal show d-block pos-installment-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="installmentModalTitle"
      >
        <div className="modal-dialog modal-lg pos-installment-modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="installmentModalTitle">
                <i className="bi bi-clipboard-check me-2"></i>
                {t('posInstallmentDetails')}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeInstallmentModal}
                disabled={processing}
                aria-label={t('Close')}
              />
            </div>
            <div className="modal-body">
              {installmentModalError && (
                <div className="alert alert-danger py-2 small mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {installmentModalError}
                </div>
              )}

              <div className="pos-installment-order-summary mb-3">
                <span>{t('posOrderTotal')}</span>
                <strong>{formatMoney(total)}</strong>
                <span className="text-muted small ms-2">
                  ({bill.length} {bill.length === 1 ? t('item') : t('items')})
                </span>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <h6 className="pos-installment-section-title">{t('customerDetails')}</h6>
                  <div className="mb-2">
                    <label className="form-label">{t('customerName')}</label>
                    <input
                      className={installmentControlClass('customer.name')}
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    />
                    {installmentFieldFeedback(
                      'customer.name',
                      t('posCustomerNameRequired'),
                      t('posDifferFromWitnessName')
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('phone')} *</label>
                    <input
                      className={installmentControlClass('customer.phone')}
                      type="tel"
                      inputMode="tel"
                      placeholder={t('enterCustomerPhone')}
                      value={customer.phone}
                      onChange={(e) => {
                        const phone = sanitizeLocalPhoneInput(e.target.value, countryCode);
                        setCustomer({ ...customer, phone });
                        setMemberPhone(phone);
                      }}
                    />
                    {installmentFieldFeedback(
                      'customer.phone',
                      t('posPhoneRequired'),
                      t('posDifferFromWitnessPhone')
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('posIdCardNo')}</label>
                    <input
                      className={installmentControlClass('customer.idCardNo')}
                      value={customer.idCardNo}
                      placeholder="901234567V or 199012345678"
                      maxLength={12}
                      autoComplete="off"
                      onChange={(e) =>
                        setCustomer({ ...customer, idCardNo: sanitizeNicInput(e.target.value) })
                      }
                    />
                    {installmentFieldFeedback(
                      'customer.idCardNo',
                      t('posIdCardRequired'),
                      t('posDifferFromWitnessId'),
                      t('posNicFormat')
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('address')}</label>
                    <input
                      className={installmentControlClass('customer.address')}
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('email')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm w-100"
                    onClick={() => handleImageCapture('idImage', 'customer')}
                  >
                    <i className="bi bi-camera me-1"></i>
                    {customer.idImage ? t('posIdCaptured') : t('posCaptureCustomerId')}
                  </button>
                </div>

                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <h6 className="pos-installment-section-title mb-0">{t('posWitnessDetails')}</h6>
                    <div className="form-check mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="includeWitness"
                        checked={includeWitness}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIncludeWitness(checked);
                          if (!checked) {
                            setWitness({
                              name: '',
                              phone: '',
                              idCardNo: '',
                              address: '',
                              idImage: null,
                            });
                          }
                        }}
                      />
                      <label className="form-check-label" htmlFor="includeWitness">
                        {t('addWitness')}
                      </label>
                    </div>
                  </div>
                  {includeWitness ? (
                    <>
                  <div className="mb-2">
                    <label className="form-label">{t('witnessName')} *</label>
                    <input
                      className={installmentControlClass('witness.name')}
                      value={witness.name}
                      onChange={(e) => setWitness({ ...witness, name: e.target.value })}
                    />
                    {installmentFieldFeedback(
                      'witness.name',
                      t('posWitnessNameRequired'),
                      t('posDifferFromCustomerName')
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('posWitnessPhone')} *</label>
                    <input
                      className={installmentControlClass('witness.phone')}
                      value={witness.phone}
                      onChange={(e) => setWitness({ ...witness, phone: e.target.value })}
                    />
                    {installmentFieldFeedback(
                      'witness.phone',
                      t('posWitnessPhoneRequired'),
                      t('posDifferFromCustomerPhone')
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('posWitnessId')} *</label>
                    <input
                      className={installmentControlClass('witness.idCardNo')}
                      value={witness.idCardNo}
                      placeholder="901234567V or 199012345678"
                      maxLength={12}
                      autoComplete="off"
                      onChange={(e) =>
                        setWitness({ ...witness, idCardNo: sanitizeNicInput(e.target.value) })
                      }
                    />
                    {installmentFieldFeedback(
                      'witness.idCardNo',
                      t('posWitnessIdRequired'),
                      t('posDifferFromCustomerId'),
                      t('posNicFormat')
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('posWitnessAddress')} *</label>
                    <input
                      className={installmentControlClass('witness.address')}
                      value={witness.address}
                      onChange={(e) => setWitness({ ...witness, address: e.target.value })}
                    />
                    {installmentFieldFeedback('witness.address', t('posWitnessAddressRequired'))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm w-100"
                    onClick={() => handleImageCapture('idImage', 'witness')}
                  >
                    <i className="bi bi-camera me-1"></i>
                    {witness.idImage ? t('posIdCaptured') : t('posCaptureWitnessId')}
                  </button>
                    </>
                  ) : (
                    <p className="text-muted small mb-0">
                      {t('witnessNotRequired')}
                    </p>
                  )}
                </div>
              </div>

              {witnessDuplicateError && !installmentTouched && (
                <div className="alert alert-warning py-2 small mb-0 mt-3" role="alert">
                  {witnessDuplicateError}
                </div>
              )}

              <hr className="my-4" />

              <h6 className="pos-installment-section-title">{t('posPaymentTerms')}</h6>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">{t('downPayment')} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={installmentControlClass('downPayment')}
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                  />
                  {installmentFieldFeedback(
                    'downPayment',
                    t('posValidDownPayment'),
                    t('posDownPaymentTooHigh')
                  )}
                </div>
                <div className="col-sm-6">
                  <label className="form-label">{t('installmentPeriod')} *</label>
                  <select
                    className="form-select"
                    value={installmentMonths}
                    onChange={(e) => setInstallmentMonths(e.target.value)}
                    disabled={installmentPeriodOptions.length === 0}
                  >
                    {installmentPeriodOptions.map((opt) => (
                      <option key={opt.months} value={opt.months}>
                        {opt.months} {t('months')} ({opt.interest_rate}% {t('interest')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {installmentPreview && (
                <div className="pos-installment-preview mt-3">
                  <div className="preview-row">
                    <span>{t('total')}</span>
                    <span>{formatMoney(installmentPreview.total)}</span>
                  </div>
                  <div className="preview-row">
                    <span>{t('downPayment')}</span>
                    <span>{formatMoney(installmentPreview.downPayment)}</span>
                  </div>
                  <div className="preview-row">
                    <span>{t('remaining')}</span>
                    <span>{formatMoney(installmentPreview.remaining)}</span>
                  </div>
                  <div className="preview-row">
                    <span>{t('interest')} ({installmentPreview.interestRate}%)</span>
                    <span>{formatMoney(installmentPreview.interestAmount)}</span>
                  </div>
                  <div className="preview-row highlight">
                    <span>{t('posTotalWithInterest')}</span>
                    <span>{formatMoney(installmentPreview.totalWithInterest)}</span>
                  </div>
                  <div className="preview-row highlight">
                    <span>{t('monthlyPayment')}</span>
                    <span>{formatMoney(installmentPreview.monthlyPayment)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={closeInstallmentModal}
                disabled={processing}
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={processing || Boolean(witnessDuplicateError)}
                onClick={handleInstallmentSaleCheckout}
              >
                {processing ? t('posProcessing') : `📋 ${t('posCreateInstallment')}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderPanel = () => (
    <aside className="pos-order-panel">
      <div className="pos-order-header">
        <h6>{mode === 'payment' ? t('recordPayment') : t('posOrderList')}</h6>
        <div className="d-flex align-items-center gap-2">
          {mode !== 'payment' && <span className="pos-order-id">{orderRef}</span>}
          <span className="pos-timer">
            <i className="bi bi-clock"></i>
            {formatTimer(elapsed)}
          </span>
          {mode !== 'payment' && bill.length > 0 && (
            <button type="button" className="pos-order-clear" onClick={clearBill} title={t('posClearOrder')}>
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>
      </div>

      {mode !== 'payment' && (
        <>
          <div className="pos-customer-row">
            <div className="pos-customer-lookup">
              <input
                type="tel"
                inputMode="tel"
                className="pos-customer-phone"
                placeholder={t('enterCustomerPhone')}
                value={memberPhone}
                onChange={(e) =>
                  setMemberPhone(sanitizeLocalPhoneInput(e.target.value, countryCode))
                }
                autoComplete="off"
              />
              <span
                className={`pos-customer-match${
                  memberLookupStatus === 'matched' ? ' is-member' : ''
                }`}
              >
                {memberLookupStatus === 'loading'
                  ? t('lookingUpMember')
                  : memberLookupStatus === 'matched'
                    ? memberCustomer?.name || memberCustomer?.phone || t('memberCustomer')
                    : memberLookupStatus === 'none'
                      ? t('noMemberForPhone')
                      : t('walkInCustomer')}
              </span>
              {hasMemberOverdue ? (
                <span className="pos-customer-overdue">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  {t('memberOverdueShort', { count: memberOverdue.count })}
                </span>
              ) : null}
            </div>
            {hasHeldBill && (
              <button
                type="button"
                className="pos-icon-action blue"
                title={t('openHoldBill')}
                onClick={handleOpenHold}
              >
                <i className="bi bi-bag-check"></i>
              </button>
            )}
          </div>

          <div className="pos-order-items">
            {bill.length === 0 ? (
              <div className="pos-order-empty">
                <i className="bi bi-cart3 d-block fs-2 mb-2"></i>
                {t('posNoItemsInBill')}
              </div>
            ) : (
              bill.map((item) => (
                <div key={item.id} className="pos-order-item">
                  <div className="pos-order-item-info">
                    <span className="pos-order-item-thumb">
                      <ProductThumbnail item={item} categories={categories} size={22} />
                    </span>
                    <span className="pos-order-item-name">{item.name}</span>
                    <button
                      type="button"
                      className="pos-order-item-remove"
                      onClick={() => removeFromBill(item.id)}
                      title={t('posRemoveItem')}
                      aria-label={t('posRemoveItem')}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <div className="pos-order-item-qty">
                    <button type="button" className="pos-qty-btn" onClick={() => decrementQuantity(item.id)}>−</button>
                    <span className="pos-qty-value">{item.quantity}</span>
                    <button type="button" className="pos-qty-btn" onClick={() => incrementQuantity(item.id)}>+</button>
                  </div>
                  <div className="pos-order-item-cost">{formatMoney(item.total)}</div>
                </div>
              ))
            )}
          </div>

          <div className="pos-summary">
            <div className="pos-summary-row">
              <span>{t('posShipping')}</span>
              <div className="pos-summary-fields">
                <div className="pos-summary-input-wrap">
                  <span className="pos-summary-currency">{currency?.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="pos-summary-input"
                    value={shipping}
                    placeholder="0.00"
                    aria-label={t('posShipping')}
                    onChange={(e) => setShipping(e.target.value)}
                  />
                </div>
                <div className="pos-summary-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="pos-summary-input pos-summary-input-pct"
                    value={shippingPercent}
                    placeholder="0"
                    aria-label={`${t('posShipping')} %`}
                    onChange={(e) => setShippingPercent(e.target.value)}
                  />
                  <span className="pos-summary-currency">%</span>
                </div>
              </div>
            </div>
            <div className="pos-summary-row discount">
              <span>{t('Discount')}</span>
              <div className="pos-summary-fields">
                <div className="pos-summary-input-wrap">
                  <span className="pos-summary-currency">{currency?.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="pos-summary-input pos-summary-input-discount"
                    value={discount}
                    placeholder="0.00"
                    aria-label={t('Discount')}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
                <div className="pos-summary-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="pos-summary-input pos-summary-input-pct pos-summary-input-discount"
                    value={discountPercent}
                    placeholder="0"
                    aria-label={`${t('Discount')} %`}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                  <span className="pos-summary-currency">%</span>
                </div>
              </div>
            </div>
            <div className="pos-summary-total">
              <span>{t('total')}</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>

          <button
            type="button"
            className="pos-checkout-btn"
            disabled={processing || (mode !== 'payment' && bill.length === 0)}
            onClick={handlePaymentAction}
          >
            {processing
              ? t('posProcessing')
              : mode === 'cash'
                ? `💳 ${t('posCompleteSale')}`
                : mode === 'installment'
                  ? `📋 ${t('posCreateInstallment')}`
                  : t('recordPayment')}
          </button>
        </>
      )}

      {mode === 'payment' && selectedPlan && (
        <div className="p-3">
          <div className="bg-light rounded p-3 mb-3 small">
            <strong>{selectedPlan.customer_name}</strong>
            <div className="mt-1">
              <span className="order-id-badge">{formatOrderId(selectedPlan.order_number, selectedPlan.sale_id, selectedPlan.id)}</span>
            </div>
            <div>{t('remaining')}: {formatMoney(selectedPlan.total_with_interest - selectedPlan.paid_amount)}</div>
          </div>
          <label className="form-label">{t('paymentAmount')}</label>
          <input type="number" className="form-control mb-2" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          <label className="form-label">{t('posNotesOptional')}</label>
          <textarea className="form-control mb-3" rows={2} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
          <button type="button" className="pos-checkout-btn" disabled={!paymentAmount || processing} onClick={handleInstallmentPayment}>
            {processing ? t('posProcessing') : t('recordPayment')}
          </button>
        </div>
      )}

      {mode === 'payment' && !selectedPlan && (
        <div className="pos-order-empty">{t('posSelectPlan')}</div>
      )}
    </aside>
  );

  if (loading) {
    return (
      <div className="pos-loading">
        <div className="pos-spinner" />
        <p>{t('loading') || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="pos-page">
      <div className="pos-mode-bar">
        <button type="button" className={`pos-mode-btn${mode === 'cash' ? ' active' : ''}`} onClick={() => setMode('cash')}>
          💰 {t('cashSale')}
        </button>
        <button
          type="button"
          className={`pos-mode-btn${mode === 'installment' ? ' active' : ''}`}
          onClick={() => {
            setMode('installment');
            setShowInstallmentModal(false);
          }}
        >
          📋 {t('installmentSale')}
        </button>
        <button type="button" className={`pos-mode-btn${mode === 'payment' ? ' active' : ''}`} onClick={() => setMode('payment')}>
          💳 {t('posInstallmentPayment')}
        </button>
        <button type="button" className={`pos-mode-btn${mode === 'return' ? ' active' : ''}`} onClick={() => setMode('return')}>
          ↩️ {t('Return')}
        </button>
        <div className="pos-mode-bar-actions">
          {mode !== 'return' && (
            <>
              {hasHeldBill ? (
                <div className="pos-hold-group">
                  <button type="button" className="pos-action-btn pos-action-hold" onClick={handleOpenHold}>
                    {t('openHoldBill')}
                  </button>
                  <button
                    type="button"
                    className="pos-action-btn pos-action-void"
                    onClick={handleDeleteHold}
                  >
                    {t('deleteHold')}
                  </button>
                </div>
              ) : (
                <button type="button" className="pos-action-btn pos-action-hold" onClick={handleHold}>
                  {t('holdSale')}
                </button>
              )}
              <button type="button" className="pos-action-btn pos-action-void" onClick={clearBill}>
                {t('posVoid')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="pos-alerts">
        {error && !showInstallmentModal && <div className="pos-alert pos-alert-error">{error}</div>}
        {success && <div className="pos-alert pos-alert-success">{success}</div>}
      </div>

      {mode === 'return' ? (
        <div className="pos-payment-layout pos-return-layout">
          <div className="pos-plans-area">
            <div className="pos-products-header">
              <div className="pos-welcome">
                <h5>{t('Return bill')}</h5>
                <p>{t('posFindSaleToReturn')}</p>
              </div>
              <div className="pos-products-toolbar">
                <form
                  className="pos-search-wrap pos-return-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLookupReturn();
                  }}
                >
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder={t('posOrderNumberPlaceholder')}
                    value={returnSearch}
                    onChange={(e) => setReturnSearch(e.target.value)}
                  />
                  <button type="submit" className="pos-return-lookup-btn" disabled={processing}>
                    {t('Find')}
                  </button>
                </form>
              </div>
            </div>
            {!returnOrder ? (
              <div className="pos-order-empty">
                <i className="bi bi-receipt d-block fs-2 mb-2"></i>
                {t('Enter the order number from the receipt')}
              </div>
            ) : (
              <div className="pos-return-lines">
                <div className="pos-return-meta">
                  <span className="order-id-badge">{formatOrderId(returnOrder.order_number)}</span>
                  <span className="small text-muted">
                    {returnOrder.payment_type === 'installment' ? t('installment') : t('cash')}
                    {returnOrder.sale_date ? ` · ${new Date(returnOrder.sale_date).toLocaleString()}` : ''}
                  </span>
                </div>
                <p className="pos-return-note small text-muted">
                  {returnType === 'warranty'
                    ? t('posWarrantyHelp')
                    : returnType === 'defect'
                      ? t('posDefectHelp')
                      : t('posCashHelp')}
                </p>
                {returnType === 'cash' && (
                  <p className="pos-return-note small text-muted">
                    {t('posRefundPriceHelp')}
                  </p>
                )}
                {(returnOrder.lines || []).map((line) => (
                  <div key={line.id} className="pos-return-line">
                    <div className="pos-return-line-info">
                      <strong>{line.item_name}</strong>
                      <span className="small text-muted">
                        {t('Sold')} {line.quantity} · {t('Returned')} {line.returned_qty || 0} · {formatMoney(line.unit_price)}
                      </span>
                    </div>
                    <div className="pos-product-qty">
                      <button
                        type="button"
                        className="pos-qty-btn"
                        disabled={!line.returnable_qty}
                        onClick={() => setReturnLineQty(line.id, (returnQtys[line.id] || 0) - 1, line.returnable_qty)}
                      >
                        −
                      </button>
                      <span className="pos-qty-value">{returnQtys[line.id] || 0}</span>
                      <button
                        type="button"
                        className="pos-qty-btn"
                        disabled={!line.returnable_qty || (returnQtys[line.id] || 0) >= line.returnable_qty}
                        onClick={() => setReturnLineQty(line.id, (returnQtys[line.id] || 0) + 1, line.returnable_qty)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <aside className="pos-order-panel">
            <div className="pos-order-header">
              <h6>{t('Return summary')}</h6>
            </div>
            <div className="pos-order-items">
              {selectedReturnLines.length === 0 ? (
                <div className="pos-order-empty">{t('Select quantities to return')}</div>
              ) : (
                selectedReturnLines.map((line) => (
                  <div key={line.id} className="pos-order-item">
                    <div className="pos-order-item-info">
                      <span>{line.item_name}</span>
                      <small>
                        {line.returnQty} × {formatMoney(line.unit_price)}
                      </small>
                    </div>
                    <strong>{formatMoney(line.returnQty * Number(line.unit_price || 0))}</strong>
                  </div>
                ))
              )}
            </div>
            <div className="pos-order-totals">
              <fieldset className="pos-return-types">
                <legend className="form-label">{t('Return type')}</legend>
                {[
                  { value: 'cash', label: t('Cash refund') },
                  { value: 'defect', label: t('Defect') },
                  { value: 'warranty', label: t('Warranty claim') },
                ].map((option) => (
                  <label key={option.value} className="pos-return-type-option">
                    <input
                      type="radio"
                      name="returnType"
                      value={option.value}
                      checked={returnType === option.value}
                      onChange={() => setReturnType(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
              <div className="pos-total-row">
                <span>{t('Returned value')}</span>
                <strong>{formatMoney(returnPreview.refundValue)}</strong>
              </div>
              {returnType === 'warranty' && (
                <div className="pos-total-row">
                  <span>{t('Replacement from stock')}</span>
                  <strong>{returnPreview.replacementQty || 0}</strong>
                </div>
              )}
              {returnType === 'cash' && (
                <div className="pos-total-row">
                  <span>{t('Cash refund')}</span>
                  <strong>{formatMoney(returnPreview.refundCash)}</strong>
                </div>
              )}
              {returnType === 'cash' && returnPreview.unpaidAfter != null && (
                <div className="pos-total-row">
                  <span>{t('Plan remaining')}</span>
                  <strong>{formatMoney(returnPreview.unpaidAfter)}</strong>
                </div>
              )}
              <label className="form-label mt-3">{t('Reason (optional)')}</label>
              <textarea
                className="form-control"
                rows={2}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="pos-checkout-btn"
              disabled={processing || selectedReturnLines.length === 0}
              onClick={handleProcessReturn}
            >
              {processing ? t('posProcessing') : t('Process return')}
            </button>
          </aside>
        </div>
      ) : mode === 'payment' ? (
        <div className="pos-payment-layout">
          <div className="pos-plans-area">
            <div className="pos-products-header">
              <div className="pos-welcome">
                <h5>{t('posInstallmentPayment')}</h5>
                <p>{t('posSelectPlan')}</p>
              </div>
              <div className="pos-products-toolbar">
                <div className="pos-search-wrap">
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder={t('posPlanSearch')}
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="pos-plans-grid">
              {filteredPlans.length === 0 ? (
                <p className="text-muted">{t('posNoPlans')}</p>
              ) : (
                filteredPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className={`pos-plan-card${selectedPlan?.id === plan.id ? ' selected' : ''}`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="fw-bold">{plan.customer_name}</div>
                    <div className="small mt-1">
                      <span className="order-id-badge">{formatOrderId(plan.order_number, plan.sale_id, plan.id)}</span>
                    </div>
                    {plan.customer_id_card && <div className="small text-muted">NIC: {plan.customer_id_card}</div>}
                    <div className="small mt-2">
                      {t('remaining')}: {formatMoney(plan.total_with_interest - plan.paid_amount)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          {renderOrderPanel()}
        </div>
      ) : (
        <div className="pos-main">
          <aside className="pos-categories">
            <button
              type="button"
              className={`pos-cat-item${!selectedCategory ? ' active' : ''}`}
              onClick={() => handleCategorySelect(null)}
            >
              <i className="bi bi-grid"></i>
              {t('All')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pos-cat-item${selectedCategory?.id === cat.id ? ' active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
              >
                <CategoryIcon name={cat.icon} size={22} className="pos-cat-icon" />
                {cat.name}
              </button>
            ))}
          </aside>

          <section className="pos-products">
            <div className="pos-products-header">
              <div className="pos-products-toolbar">
                <div className="pos-search-wrap">
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder={t('Search Product')}
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pos-product-grid-wrap">
              <div className="pos-product-grid">
                {displayItems.length === 0 ? (
                  <p className="text-muted py-4">
                    {mode === 'installment' && !selectedCategory
                      ? t('posChooseCategory')
                      : t('No items found')}
                  </p>
                ) : (
                  displayItems.map((item) => {
                    const inBill = bill.find((b) => b.id === item.id);
                    const qty = inBill?.quantity || 0;
                    const remaining = Math.max(0, Number(item.quantity || 0) - qty);
                    const threshold = Number(settings?.lowStockThreshold ?? 15);
                    const stockLevel = remaining <= 0 ? 'out' : remaining <= threshold ? 'low' : 'ok';
                    const cat = categories.find((c) => c.id === item.category_id);
                    const { listPrice, price, promotion } = applyPromotionPrice(item, activePromotions);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`pos-product-card${qty > 0 ? ' selected' : ''}`}
                        onClick={() => addToBill(item)}
                      >
                        <span className="pos-product-check"><i className="bi bi-check-lg"></i></span>
                        <div className="pos-product-image">
                          {promotion ? (
                            <span className="pos-promo-badge">{Number(promotion.percent)}% off</span>
                          ) : null}
                          <ProductThumbnail item={item} categories={categories} size={36} />
                        </div>
                        <div className="pos-product-cat">{cat?.name || 'General'}</div>
                        <div className="pos-product-name">{item.name}</div>
                        <div className="pos-product-price">
                          {promotion ? (
                            <>
                              <span className="pos-product-price-original">{formatMoney(listPrice)}</span>
                              <span>{formatMoney(price)}</span>
                            </>
                          ) : (
                            formatMoney(listPrice)
                          )}
                        </div>
                        <div className="pos-product-footer">
                          <span className={`pos-stock-badge pos-stock-badge--${stockLevel}`}>
                            {remaining <= 0 ? t('outOfStock') : `${remaining} ${t('left')}`}
                          </span>
                          <div className="pos-product-qty" onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="pos-qty-btn" onClick={(e) => handleProductQty(item, -1, e)} disabled={qty === 0}>−</button>
                            <span className="pos-qty-value">{qty}</span>
                            <button
                              type="button"
                              className="pos-qty-btn"
                              onClick={(e) => handleProductQty(item, 1, e)}
                              disabled={qty >= item.quantity}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {renderOrderPanel()}
        </div>
      )}

      {renderInstallmentModal()}
      <ReceiptPrintLayer job={printJob} onDone={() => setPrintJob(null)} />
    </div>
  );
}

export default SellItems;
