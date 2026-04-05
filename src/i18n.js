import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      sellItems: 'Sell Items',
      inventory: 'Inventory',
      salesReport: 'Sales Report',
      users: 'Users',
      installmentPlans: 'Installment Plans',
      payments: 'Payments',
      installmentPayments: 'Installment Payments',
      logout: 'Logout',
      
      // Dashboard
      todayStatistics: "Today's Statistics",
      todaySales: "Today's Sales",
      todayRevenue: "Today's Revenue",
      todayProfit: "Today's Profit",
      itemsSoldToday: "Items Sold Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      totalSales: "Total Sales",
      revenue: "Revenue",
      profit: "Profit",
      itemsSold: "Items Sold",
      lowStockAlert: "Low Stock Alert",
      itemName: "Item Name",
      quantity: "Quantity",
      price: "Price",
      todaySalesList: "Today's Sales",
      time: "Time",
      item: "Item",
      total: "Total",
      teller: "Teller",
      noSalesToday: "No Sales Recorded Today",
      payment: "Payment",
      paymentType: "Payment Type",
      cash: "Cash",
      installment: "Installment",
      
      // Login
      shopInventory: "Shop Inventory",
      username: "Username",
      password: "Password",
      login: "Login",
      loggingIn: "Logging in...",
      defaultCredentials: "Default Credentials",
      admin: "Admin",
      forgotPassword: "Forgot Password?",
      
      // Common
      loading: "Loading...",
      error: "Error",
      success: "Success",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      clear: "Clear",
      actions: "Actions",
      date: "Date",
      status: "Status",
      description: "Description",
      name: "Name",
      phone: "Phone",
      email: "Email",
      address: "Address",
      yes: "Yes",
      no: "No",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      submit: "Submit",
      close: "Close",
      view: "View",
      download: "Download",
      upload: "Upload",
      
      // Sell Items
      processSale: "Process Sale",
      selectItem: "Select Item",
      cashSale: "Cash Sale",
      installmentSale: "Installment Sale",
      customerInformation: "Customer Information",
      customerName: "Customer Name",
      phoneNumber: "Phone Number",
      idCardNumber: "ID Card Number",
      witnessInformation: "Witness Information",
      witnessName: "Witness Name",
      installmentDetails: "Installment Details",
      downPayment: "Down Payment",
      installmentPeriod: "Installment Period",
      months: "Months",
      submitSale: "Submit Sale",
      
      // Sales Report
      overallStatistics: "Overall Statistics",
      filterByDateRange: "Filter by Date Range",
      startDate: "Start Date",
      endDate: "End Date",
      applyFilter: "Apply Filter",
      allSales: "All Sales",
      
      // Inventory
      manageInventory: "Manage Inventory",
      addNewItem: "Add New Item",
      category: "Category",
      buyingPrice: "Buying Price",
      sellingPrice: "Selling Price",
      availableItems: "Available Items",
      outOfStock: "Out of Stock",
      
      // Installment Plans
      activeInstallmentPlans: "Active Installment Plans",
      customerDetails: "Customer Details",
      planDetails: "Plan Details",
      paymentProgress: "Payment Progress",
      installmentSettings: "Installment Settings",
      interestRate: "Interest Rate",
      remainingBalance: "Remaining Balance",
      paidAmount: "Paid Amount",
      nextPayment: "Next Payment",
      dueDate: "Due Date",
      
      // Users
      manageUsers: "Manage Users",
      addNewUser: "Add New User",
      role: "Role",
      active: "Active",
      inactive: "Inactive",
      
      // Messages
      saleSuccess: "Sale Successful",
      saleError: "Sale Error",
      itemAdded: "Item Added",
      itemUpdated: "Item Updated",
      itemDeleted: "Item Deleted",
      userAdded: "User Added",
      userUpdated: "User Updated",
      confirmDelete: "Confirm Delete",
      areYouSure: "Are you sure?",
    }
  },
  si: {
    translation: {
      // Navigation - Sinhala
      dashboard: 'උපකරණ පුවරුව',
      sellItems: 'භාණ්ඩ විකුණන්න',
      inventory: 'ඉන්වෙන්ටරි',
      salesReport: 'විකුණුම් වාර්තාව',
      users: 'පරිශීලකයින්',
      installmentPlans: 'වාරික සැලසුම්',
      payments: 'ගෙවීම්',
      installmentPayments: 'වාරික ගෙවීම්',
      logout: 'ඉවත්වන්න',
      
      // Dashboard - Sinhala
      todayStatistics: 'අද දින සංඛ්‍යාලේඛන',
      todaySales: 'අද දින විකුණුම්',
      todayRevenue: 'අද දින ආදායම',
      todayProfit: 'අද දින ලාභය',
      itemsSoldToday: 'අද විකුණු භාණ්ඩ',
      thisWeek: 'මෙම සතිය',
      thisMonth: 'මෙම මාසය',
      totalSales: 'මුළු විකුණුම්',
      revenue: 'ආදායම',
      profit: 'ලාභය',
      itemsSold: 'විකුණූ භාණ්ඩ',
      lowStockAlert: 'අඩු තොග ඇඟවීම',
      itemName: 'භාණ්ඩ නම',
      quantity: 'ප්‍රමාණය',
      price: 'මිල',
      todaySalesList: 'අද දින විකුණුම්',
      time: 'වේලාව',
      item: 'භාණ්ඩය',
      total: 'එකතුව',
      teller: 'අලෙවිකරු',
      noSalesToday: 'අද දින විකුණුමක් නැත',
      payment: 'ගෙවීම',
      paymentType: 'ගෙවීම් වර්ගය',
      cash: 'මුදල්',
      installment: 'වාරික',
      
      // Login - Sinhala
      shopInventory: 'වෙළඳ ඉන්වෙන්ටරි',
      username: 'පරිශීලක නාමය',
      password: 'මුරපදය',
      login: 'ඇතුල් වන්න',
      loggingIn: 'ඇතුල් වෙමින්...',
      defaultCredentials: 'පෙරනිමි අක්තපත්‍ර',
      admin: 'පරිපාලක',
      forgotPassword: 'මුරපදය අමතක ද?',
      
      // Common - Sinhala
      loading: 'පූරණය වෙමින්...',
      error: 'දෝෂයක්',
      success: 'සාර්ථකයි',
      save: 'සුරකින්න',
      cancel: 'අවලංගු කරන්න',
      delete: 'මකන්න',
      edit: 'සංස්කරණය',
      add: 'එකතු කරන්න',
      search: 'සොයන්න',
      filter: 'පෙරහන',
      clear: 'මකන්න',
      actions: 'ක්‍රියාමාර්ග',
      date: 'දිනය',
      status: 'තත්ත්වය',
      description: 'විස්තරය',
      name: 'නම',
      phone: 'දුරකථනය',
      email: 'විද්‍යුත් ලිපිනය',
      address: 'ලිපිනය',
      yes: 'ඔව්',
      no: 'නැත',
      confirm: 'තහවුරු කරන්න',
      back: 'ආපසු',
      next: 'ඊළඟ',
      submit: 'ඉදිරිපත් කරන්න',
      close: 'වසන්න',
      view: 'බලන්න',
      download: 'බාගන්න',
      upload: 'උඩුගත කරන්න',
      
      // Sell Items - Sinhala
      processSale: 'විකුණුම් ක්‍රියාවලිය',
      selectItem: 'භාණ්ඩය තෝරන්න',
      cashSale: 'මුදල් විකුණුම',
      installmentSale: 'වාරික විකුණුම',
      customerInformation: 'ගනුදෙනුකරුගේ තොරතුරු',
      customerName: 'ගනුදෙනුකරුගේ නම',
      phoneNumber: 'දුරකථන අංකය',
      idCardNumber: 'හැඳුනුම්පත් අංකය',
      witnessInformation: 'සාක්ෂිකරුගේ තොරතුරු',
      witnessName: 'සාක්ෂිකරුගේ නම',
      installmentDetails: 'වාරික විස්තර',
      downPayment: 'පූර්ව ගෙවීම',
      installmentPeriod: 'වාරික කාලය',
      months: 'මාස',
      submitSale: 'විකුණුම ඉදිරිපත් කරන්න',
      
      // Sales Report - Sinhala
      overallStatistics: 'සමස්ත සංඛ්‍යාලේඛන',
      filterByDateRange: 'දින පරාසය අනුව පෙරහන්',
      startDate: 'ආරම්භක දිනය',
      endDate: 'අවසාන දිනය',
      applyFilter: 'පෙරහන යොදන්න',
      allSales: 'සියලුම විකුණුම්',
      
      // Inventory - Sinhala
      manageInventory: 'ඉන්වෙන්ටරි කළමනාකරණය',
      addNewItem: 'නව භාණ්ඩයක් එකතු කරන්න',
      category: 'වර්ගය',
      buyingPrice: 'මිලදී ගැනීමේ මිල',
      sellingPrice: 'විකුණුම් මිල',
      availableItems: 'ලබා ගත හැකි භාණ්ඩ',
      outOfStock: 'තොගයෙන් ඉවත්',
      
      // Installment Plans - Sinhala
      activeInstallmentPlans: 'ක්‍රියාත්මක වාරික සැලසුම්',
      customerDetails: 'ගනුදෙනුකරුගේ විස්තර',
      planDetails: 'සැලසුම් විස්තර',
      paymentProgress: 'ගෙවීම් ප්‍රගතිය',
      installmentSettings: 'වාරික සැකසුම්',
      interestRate: 'පොලී අනුපාතය',
      remainingBalance: 'ඉතිරි ශේෂය',
      paidAmount: 'ගෙවූ මුදල',
      nextPayment: 'ඊළඟ ගෙවීම',
      dueDate: 'හිමි දිනය',
      
      // Users - Sinhala
      manageUsers: 'පරිශීලකයින් කළමනාකරණය',
      addNewUser: 'නව පරිශීලකයෙක් එකතු කරන්න',
      role: 'භූමිකාව',
      active: 'ක්‍රියාත්මක',
      inactive: 'අක්‍රිය',
      
      // Messages - Sinhala
      saleSuccess: 'විකුණුම සාර්ථකයි',
      saleError: 'විකුණුම වැරදිය',
      itemAdded: 'භාණ්ඩය එකතු කරන ලදී',
      itemUpdated: 'භාණ්ඩය යාවත්කාලීන කරන ලදී',
      itemDeleted: 'භාණ්ඩය මකන ලදී',
      userAdded: 'පරිශීලකයා එකතු කරන ලදී',
      userUpdated: 'පරිශීලකයා යාවත්කාලීන කරන ලදී',
      confirmDelete: 'මකා දැමීම තහවුරු කරන්න',
      areYouSure: 'ඔබට විශ්වාසද?',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
