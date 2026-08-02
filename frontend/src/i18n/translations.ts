export type Language = 'en' | 'hi' | 'mr';

export interface Translations {
  nav: {
    brand: string;
    features: string;
    rateSheets: string;
    pricing: string;
    caseStudies: string;
    signIn: string;
    getStarted: string;
    dashboard: string;
    logout: string;
    searchFarmers: string;
    language: string;
  };
  landing: {
    heroBadge: string;
    heroTitle1: string;
    heroTitleHighlight: string;
    heroSubtitle: string;
    getStartedFree: string;
    seeDemo: string;
    noCcRequired: string;
    demoTabCollection: string;
    demoTabFarmers: string;
    demoTabRates: string;
    demoTabFeed: string;
    liveMockup: string;
    recordMilkIntakeTitle: string;
    recordMilkIntakeDesc: string;
    shiftSupport: string;
    fatValidationWarning: string;
    printReceipts: string;
    collectionCalculator: string;
    activeChart: string;
    milkType: string;
    cow: string;
    buffalo: string;
    mix: string;
    quantityLitres: string;
    fatPercent: string;
    snfPercent: string;
    computedPrice: string;
    perLitre: string;
    totalPayout: string;
    farmerDirectoryTitle: string;
    farmerDirectoryDesc: string;
    checkOutstandingAdvance: string;
    toggleActiveStatus: string;
    integratedLedger: string;
    farmersLedgerView: string;
    prefers: string;
    advanceBalance: string;
    rateSlabsTitle: string;
    rateSlabsDesc: string;
    cowBuffaloMixSheets: string;
    multipleActiveCharts: string;
    customizableSlabs: string;
    activeCowSlabs: string;
    fatRange: string;
    snfRange: string;
    pricePerLitre: string;
    feedInventoryTitle: string;
    feedInventoryDesc: string;
    trackBulkInventory: string;
    recordCustomerFeed: string;
    linkedWithAccounts: string;
    bookFeedSale: string;
    stockLeft: string;
    itemName: string;
    quantity: string;
    pricePerBag: string;
    chargedToLedger: string;
    yesAutoDeduct: string;
    totalSale: string;
    whyChooseUsTitle: string;
    whyChooseUsDesc: string;
    instantFatSnfTitle: string;
    instantFatSnfDesc: string;
    advanceDeductionsTitle: string;
    advanceDeductionsDesc: string;
    paymentSettleWizardTitle: string;
    paymentSettleWizardDesc: string;
    footerBrand: string;
    allRightsReserved: string;
    terms: string;
    privacy: string;
    support: string;
  };
  auth: {
    signInTitle: string;
    registerTitle: string;
    ownerFullName: string;
    mobileNumber: string;
    password: string;
    passwordMin: string;
    logIn: string;
    signUp: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
    stepPhone: string;
    stepOtp: string;
    stepDetails: string;
    sendOtp: string;
    verifyOtp: string;
    otpSentTo: string;
    enterOtp: string;
    changeNumber: string;
    resendOtp: string;
    dairyName: string;
    village: string;
    taluka: string;
    district: string;
    state: string;
    locationInfo: string;
    dairyConfig: string;
    pricingModel: string;
    supportedMilk: string;
    collectionShift: string;
    settlementCycle: string;
    completeRegistration: string;
    fatSnfBased: string;
    fatBasedOnly: string;
    fixedRate: string;
    cowOnly: string;
    buffaloOnly: string;
    mixBoth: string;
    bothShifts: string;
    morningOnly: string;
    eveningOnly: string;
    weeklyCycle: string;
    biweeklyCycle: string;
    monthlyCycle: string;
    dailyCycle: string;
  };
  dashboard: {
    navOverview: string;
    navMilkRegistry: string;
    navFarmers: string;
    navRates: string;
    navFeeds: string;
    navBilling: string;
    navAdvances: string;
    landingView: string;
    logOut: string;
    activeDairyHub: string;
    loggedInAs: string;
    pricingMode: string;
    refresh: string;
    litersToday: string;
    intakeValue: string;
    activeFarmers: string;
    rateChartsCount: string;
    liveFromDb: string;
    todaysMilkCollections: string;
    noCollectionsToday: string;
    code: string;
    name: string;
    shift: string;
    qtyL: string;
    fatSnf: string;
    rate: string;
    total: string;
    del: string;
    stockStatus: string;
    noStockRecorded: string;
    recordDeliveryEntry: string;
    morning: string;
    evening: string;
    selectFarmer: string;
    farmerLabel: string;
    milkLabel: string;
    qtyLabel: string;
    fatLabel: string;
    snfLabel: string;
    saveMilkCollection: string;
    invalidPositiveQty: string;
    invalidPositiveFat: string;
    invalidPositiveSnf: string;
    todaysMilkLog: string;
    noEntriesToday: string;
    searchPlaceholder: string;
    registerFarmer: string;
    mobile: string;
    milkType: string;
    address: string;
    status: string;
    active: string;
    inactive: string;
    noFarmersFound: string;
    pricingRateCharts: string;
    chartsDbDesc: string;
    noRateCharts: string;
    baseRate: string;
    fatSteps: string;
    cattleFeedStock: string;
    billingSettlementHub: string;
    selectFarmerForBilling: string;
    startDate: string;
    endDate: string;
    totalLitres: string;
    grossAmount: string;
    netPayable: string;
    settleBill: string;
    settledBillsHistory: string;
    noBillsSettled: string;
    issueAdvance: string;
    addRepayment: string;
    advanceNumber: string;
    originalAmount: string;
    recoveredAmount: string;
    pendingAmount: string;
    givenDate: string;
    partiallyRecovered: string;
    closed: string;
    totalAdvanceIssued: string;
    totalRecoveredAmount: string;
    totalPendingBalance: string;
    noAdvancesFound: string;
    recordRepaymentTitle: string;
    repaymentAmountLabel: string;
    notesOptional: string;
    saveAdvance: string;
    saveRepayment: string;
    advanceHistoryTitle: string;
    sellFeedToFarmer: string;
    addDealer: string;
    addPurchase: string;
    chooseFarmer: string;
    selectFeedBatch: string;
    chooseBatch: string;
    quantityBags: string;
    amountPaid: string;
    bookOnCredit: string;
    recordFeedSale: string;
    feedSalesHistory: string;
    date: string;
    feed: string;
    qty: string;
    mode: string;
    paid: string;
    credit: string;
    noSalesRecorded: string;
    addWholesaleDealer: string;
    dealerCode: string;
    dealerCodePlaceholder: string;
    dealerName: string;
    dealerNamePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    addressPlaceholder: string;
    createDealer: string;
    recordBulkPurchaseTitle: string;
    wholesaleDealer: string;
    chooseDealer: string;
    feedProductName: string;
    feedProductNamePlaceholder: string;
    bagsQty: string;
    buyRateBag: string;
    sellRateBag: string;
    purchaseDate: string;
    logBulkPurchase: string;
  };
    customer: {
      title: string;
      welcome: string;
      loggedInAs: string;
      searchPlaceholder: string;
      registerButton: string;
      registerModalTitle: string;
      customerCode: string;
      customerCodePlaceholder: string;
      fullName: string;
      fullNamePlaceholder: string;
      mobile: string;
      mobilePlaceholder: string;
      milkType: string;
      addressVillage: string;
      addressPlaceholder: string;
      cow: string;
      buffalo: string;
      mix: string;
      registerSubmit: string;
      cancel: string;
      tableCode: string;
      tableName: string;
      tableMobile: string;
      tableMilkType: string;
      tableAddress: string;
      tableStatus: string;
      tableActions: string;
      statusActive: string;
      statusInactive: string;
      emptyState: string;
      noSearchResults: string;
      loading: string;
      showing: string;
      next: string;
      previous: string;
      codeRequired: string;
      codeMin: string;
      codeMax: string;
      nameRequired: string;
      mobileRequired: string;
      mobileInvalid: string;
      milkTypeRequired: string;
      addressRequired: string;
      successToast: string;
      errorToast: string;
      duplicateCodeToast: string;
    };
  }

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      brand: 'LactoFlow',
      features: 'Features',
      rateSheets: 'Slab Setup',
      pricing: 'Pricing',
      caseStudies: 'Case Studies',
      signIn: 'Sign In',
      getStarted: 'Get started',
      dashboard: 'Go to Dashboard',
      logout: 'Logout',
      searchFarmers: 'Search farmers...',
      language: 'Language',
    },
    landing: {
      heroBadge: 'Automate Dairy Operations & Payouts',
      heroTitle1: 'Unleash dairy efficiency with',
      heroTitleHighlight: 'LactoFlow + Automated Billing',
      heroSubtitle: 'Record milk weight daily, auto-lookup FAT + SNF rate charts, handle advances, and settle periodic bills in one unified workspace.',
      getStartedFree: 'Get started for free',
      seeDemo: 'See interactive demo',
      noCcRequired: 'No credit card required. Configurable for COW, BUFFALO, or MIXED milk types.',
      demoTabCollection: 'Milk Collection',
      demoTabFarmers: 'Farmer Directory',
      demoTabRates: 'Rate Slabs',
      demoTabFeed: 'Feed Inventory',
      liveMockup: 'Live Mockup',
      recordMilkIntakeTitle: 'Record milk intake with live rate calculation',
      recordMilkIntakeDesc: 'Input milk weight and FAT/SNF percentage. The system automatically fetches pricing from active rate charts (Fixed, Fat-based, or Fat + SNF grids) and displays the net total instantly.',
      shiftSupport: 'Supports MORNING and EVENING shifts.',
      fatValidationWarning: 'Validation warnings for impossible FAT% ranges.',
      printReceipts: 'Print receipt slips or trigger SMS triggers to farmers.',
      collectionCalculator: 'Collection Calculator',
      activeChart: 'Active Chart',
      milkType: 'Milk Type',
      cow: 'COW',
      buffalo: 'BUFFALO',
      mix: 'MIXED (Flat Rate)',
      quantityLitres: 'Quantity (Litres)',
      fatPercent: 'Fat %',
      snfPercent: 'SNF %',
      computedPrice: 'Computed Price',
      perLitre: '/ Litre',
      totalPayout: 'Total Payout',
      farmerDirectoryTitle: 'Farmer directory with automated advance ledgers',
      farmerDirectoryDesc: 'Track details for every supplier. Assign unique farmer codes, bank account details, and manage advance payments (loans) that are automatically recovered during billing cycles.',
      checkOutstandingAdvance: 'Check outstanding advance balance at a glance.',
      toggleActiveStatus: 'Toggle active/inactive status to stop entries.',
      integratedLedger: 'Integrated ledger for advance given/deducted history.',
      farmersLedgerView: 'Farmers Ledger View',
      prefers: 'Prefers',
      advanceBalance: 'Advance Balance',
      rateSlabsTitle: 'Configurable price sheets by FAT and SNF ranges',
      rateSlabsDesc: 'Set precise pricing slabs. For instance, define that COW milk with FAT between 3.5% and 3.9% and SNF between 8.5% and 9.0% commands exactly ₹36.00/litre.',
      cowBuffaloMixSheets: 'Add separate sheets for Cow, Buffalo, and Mixed.',
      multipleActiveCharts: 'Multiple active charts categorized by seasons.',
      customizableSlabs: 'Fully customizable slabs to match government rules.',
      activeCowSlabs: 'Active Cow Slabs',
      fatRange: 'Fat Range',
      snfRange: 'SNF Range',
      pricePerLitre: 'Price per Litre',
      feedInventoryTitle: 'Cattle feed inventory and credit sales linking',
      feedInventoryDesc: 'Dairy centers can buy cattle feed in bulk from suppliers and sell bags of feed directly to registered farmers, booking the sales amount directly to the farmer\'s billing sheet.',
      trackBulkInventory: 'Track bulk inventory and purchase pricing logs.',
      recordCustomerFeed: 'Record customer feed sales with credit/cash options.',
      linkedWithAccounts: 'Linked with customer accounts to deduct from final payouts.',
      bookFeedSale: 'Book Feed Sale to Farmer',
      stockLeft: 'Stock Left',
      itemName: 'Item Name',
      quantity: 'Quantity',
      pricePerBag: 'Price per Bag',
      chargedToLedger: 'Charged to Ledger (Credit)',
      yesAutoDeduct: 'Yes, auto deduct in bill',
      totalSale: 'Total Sale',
      whyChooseUsTitle: 'Built specifically for dairy chilling hubs and cooperatives',
      whyChooseUsDesc: 'Legacy systems rely on registers, calculator errors, and high disputes. LactoFlow centralizes pricing rules, entries, advances, and payments in one click.',
      instantFatSnfTitle: 'Instant Fat-SNF Lookups',
      instantFatSnfDesc: 'Zero calculation delay. Add collections and watch LactoFlow automatically calculate the rate from active Cow, Buffalo, or Mixed rate grids based on real-time parameters.',
      advanceDeductionsTitle: 'Advance Deductions',
      advanceDeductionsDesc: 'Provide advances or sell cattle feed bags on credit. LactoFlow tracks this balance and automatically deducts the pending advance amount during the next bill cycle settlement.',
      paymentSettleWizardTitle: 'Payment Settle Wizard',
      paymentSettleWizardDesc: 'Generate bills weekly, biweekly, or monthly. Calculate gross milk value, subtract feeds and cash loans, generate receipts, and settle via bank transfers in a single click.',
      footerBrand: 'LactoFlow Dairy Hub',
      allRightsReserved: 'LactoFlow System. All rights reserved.',
      terms: 'Terms',
      privacy: 'Privacy',
      support: 'Contact Support',
    },
    auth: {
      signInTitle: 'Sign In to LactoFlow',
      registerTitle: 'Create Owner Account',
      ownerFullName: "Owner's Full Name",
      mobileNumber: 'Mobile Number',
      password: 'Password',
      passwordMin: 'Password (Min 8 chars)',
      logIn: 'Log In',
      signUp: 'Sign Up',
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',
      stepPhone: 'Phone',
      stepOtp: 'OTP',
      stepDetails: 'Details',
      sendOtp: 'Send OTP',
      verifyOtp: 'Verify OTP',
      otpSentTo: 'A 6-digit code was sent to',
      enterOtp: 'Enter the OTP',
      changeNumber: 'Change number',
      resendOtp: 'Resend OTP',
      dairyName: 'Dairy Name',
      village: 'Village',
      taluka: 'Taluka',
      district: 'District',
      state: 'State',
      locationInfo: 'Location Info',
      dairyConfig: 'Dairy System Configurations',
      pricingModel: 'Pricing Model',
      supportedMilk: 'Supported Milk',
      collectionShift: 'Collection Shifts',
      settlementCycle: 'Settlement Cycle',
      completeRegistration: 'Complete Registration',
      fatSnfBased: 'FAT & SNF Based',
      fatBasedOnly: 'FAT Based Only',
      fixedRate: 'Fixed Rate (Flat Price)',
      cowOnly: 'Cow Milk Only',
      buffaloOnly: 'Buffalo Milk Only',
      mixBoth: 'Mixed (Both supported)',
      bothShifts: 'Both Shifts',
      morningOnly: 'Morning Only',
      eveningOnly: 'Evening Only',
      weeklyCycle: 'Weekly Cycle',
      biweeklyCycle: 'Bi-weekly (15 days)',
      monthlyCycle: 'Monthly Cycle',
      dailyCycle: 'Daily Cash Settlement',
    },
    dashboard: {
      navOverview: 'Dashboard Overview',
      navMilkRegistry: 'Milk Entry Registry',
      navFarmers: 'Farmer Accounts',
      navRates: 'Rate Slab Sheets',
      navFeeds: 'Feeds & Sales',
      navBilling: 'Settle Billing',
      navAdvances: 'Advance Ledger',
      landingView: 'Landing View',
      logOut: 'Log Out',
      activeDairyHub: 'Active Dairy Hub',
      loggedInAs: 'Logged in as',
      pricingMode: 'Pricing Mode',
      refresh: 'Refresh',
      litersToday: 'Liters Today',
      intakeValue: 'Intake Value',
      activeFarmers: 'Active Farmers',
      rateChartsCount: 'Rate Charts',
      liveFromDb: 'Live from database',
      todaysMilkCollections: "Today's Milk Collections",
      noCollectionsToday: 'No milk collected yet today. Go to the "Milk Entry Registry" tab to log records.',
      code: 'Code',
      name: 'Name',
      shift: 'Shift',
      qtyL: 'Qty (L)',
      fatSnf: 'Fat/SNF',
      rate: 'Rate/L',
      total: 'Amount',
      del: 'Del',
      stockStatus: 'Cattle Feed Stock',
      noStockRecorded: 'No feed stock recorded. Add a purchase in "Feeds & Sales".',
      recordDeliveryEntry: 'Record Delivery Entry',
      morning: 'Morning',
      evening: 'Evening',
      selectFarmer: '-- Select Farmer --',
      farmerLabel: 'Farmer',
      milkLabel: 'Milk',
      qtyLabel: 'Qty (L)',
      fatLabel: 'Fat %',
      snfLabel: 'SNF %',
      saveMilkCollection: 'Save Milk Collection',
      invalidPositiveQty: 'Quantity must be a positive number greater than 0.',
      invalidPositiveFat: 'Fat % cannot be a negative value.',
      invalidPositiveSnf: 'SNF % cannot be a negative value.',
      todaysMilkLog: "Today's Milk Collections Log",
      noEntriesToday: 'No entries today',
      searchPlaceholder: 'Search by code, name or mobile...',
      registerFarmer: 'Register Farmer',
      mobile: 'Mobile',
      milkType: 'Milk Type',
      address: 'Address',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      noFarmersFound: 'No farmers found',
      pricingRateCharts: 'Pricing Rate Charts',
      chartsDbDesc: 'Charts are stored in the database and used for live rate calculation during milk entry.',
      noRateCharts: 'No rate charts configured yet.',
      baseRate: 'Base Rate',
      fatSteps: 'FAT Steps',
      cattleFeedStock: 'Cattle Feed Stock',
      billingSettlementHub: 'Billing Settlement Hub',
      selectFarmerForBilling: 'Select Farmer for Billing',
      startDate: 'Start Date',
      endDate: 'End Date',
      totalLitres: 'Total Litres',
      grossAmount: 'Gross Amount',
      netPayable: 'Net Payable Amount',
      settleBill: 'Settle & Generate Bill',
      settledBillsHistory: 'Settled Bills History',
      noBillsSettled: 'No settled bills history for this session.',
      issueAdvance: 'Issue New Advance',
      addRepayment: 'Record Repayment',
      advanceNumber: 'Advance #',
      originalAmount: 'Original Amount',
      recoveredAmount: 'Recovered Amount',
      pendingAmount: 'Pending Balance',
      givenDate: 'Given Date',
      partiallyRecovered: 'Partial',
      closed: 'Closed',
      totalAdvanceIssued: 'Total Advances Issued',
      totalRecoveredAmount: 'Total Recovered',
      totalPendingBalance: 'Outstanding Pending',
      noAdvancesFound: 'No advances recorded yet.',
      recordRepaymentTitle: 'Record Manual Repayment',
      repaymentAmountLabel: 'Repayment Amount (₹)',
      notesOptional: 'Notes / Remarks (Optional)',
      saveAdvance: 'Issue Advance',
      saveRepayment: 'Save Repayment',
      advanceHistoryTitle: 'Transaction History',
      sellFeedToFarmer: 'Sell Feed to Farmer',
      addDealer: '+ Dealer',
      addPurchase: '+ Purchase',
      chooseFarmer: '-- Choose Farmer --',
      selectFeedBatch: 'Select Feed Batch (Stock)',
      chooseBatch: '-- Select Batch --',
      quantityBags: 'Quantity (Bags)',
      amountPaid: 'Amount Paid (₹)',
      bookOnCredit: 'Book on Credit',
      recordFeedSale: 'Record Feed Sale',
      feedSalesHistory: 'Feed Sales History',
      date: 'Date',
      feed: 'Feed',
      qty: 'Qty',
      mode: 'Mode',
      paid: 'Paid',
      credit: 'Credit',
      noSalesRecorded: 'No sales recorded',
      addWholesaleDealer: 'Add Wholesale Dealer',
      dealerCode: 'Dealer Code',
      dealerCodePlaceholder: 'e.g. DLR-001',
      dealerName: 'Dealer Name',
      dealerNamePlaceholder: 'e.g. Vijay Patel',
      phone: 'Phone',
      phonePlaceholder: '9876543210',
      addressPlaceholder: 'Address',
      createDealer: 'Create Dealer',
      recordBulkPurchaseTitle: 'Record Bulk Stock Purchase',
      wholesaleDealer: 'Wholesale Dealer',
      chooseDealer: '-- Choose Dealer --',
      feedProductName: 'Feed Product Name',
      feedProductNamePlaceholder: 'e.g. Kapila Super Feed 50kg',
      bagsQty: 'Bags Qty',
      buyRateBag: 'Buy Rate/Bag (₹)',
      sellRateBag: 'Sell Rate/Bag (₹)',
      purchaseDate: 'Purchase Date',
      logBulkPurchase: 'Log Bulk Purchase',
    },
    customer: {
      title: 'Farmer Accounts',
      welcome: 'Welcome to Farmer Management',
      loggedInAs: 'Logged in as',
      searchPlaceholder: 'Search by code, name or mobile...',
      registerButton: 'Register Farmer',
      registerModalTitle: 'Register Farmer',
      customerCode: 'Customer Code',
      customerCodePlaceholder: 'e.g. 101',
      fullName: 'Full Name',
      fullNamePlaceholder: 'e.g. Ramesh Patil',
      mobile: 'Mobile',
      mobilePlaceholder: '10 digit number',
      milkType: 'Milk Type',
      addressVillage: 'Address / Village',
      addressPlaceholder: 'Village name',
      cow: 'Cow',
      buffalo: 'Buffalo',
      mix: 'Mix',
      registerSubmit: 'Register Farmer',
      cancel: 'Cancel',
      tableCode: 'Code',
      tableName: 'Name',
      tableMobile: 'Mobile',
      tableMilkType: 'Milk Type',
      tableAddress: 'Address',
      tableStatus: 'Status',
      tableActions: 'Actions',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      emptyState: 'No farmers found',
      noSearchResults: 'No matching farmer found.',
      loading: 'Loading farmers...',
      showing: 'Showing',
      next: 'Next',
      previous: 'Previous',
      codeRequired: 'Customer code is required',
      codeMin: 'Customer code must be at least 1 character',
      codeMax: 'Customer code must be at most 20 characters',
      nameRequired: 'Full name is required',
      mobileRequired: 'Mobile number is required',
      mobileInvalid: 'Please enter a valid 10-digit mobile number',
      milkTypeRequired: 'Milk type is required',
      addressRequired: 'Address is required',
      successToast: 'Farmer registered successfully',
      errorToast: 'Unable to register farmer',
      duplicateCodeToast: 'Customer code already exists. Please enter a different code.',
    },
  },
  hi: {
    nav: {
      brand: 'लेक्टोफ्लो',
      features: 'विशेषताएं',
      rateSheets: 'दर पत्रक',
      pricing: 'मूल्य निर्धारण',
      caseStudies: 'सफलता की कहानियां',
      signIn: 'साइन इन',
      getStarted: 'शुरू करें',
      dashboard: 'डैशबोर्ड पर जाएं',
      logout: 'लॉगआउट',
      searchFarmers: 'किसान खोजें...',
      language: 'भाषा',
    },
    landing: {
      heroBadge: 'डेयरी संचालन और भुगतान का स्वचालन',
      heroTitle1: 'डेयरी दक्षता को नई ऊंचाई दें',
      heroTitleHighlight: 'लेक्टोफ्लो + स्वचालित बिलिंग',
      heroSubtitle: 'दैनिक दूध का वजन दर्ज करें, वसा (FAT) + एसएनएफ (SNF) दर पत्रक का स्वतः मिलान करें, अग्रिम राशि प्रबंधित करें और आवधिक बिलों का निपटान करें।',
      getStartedFree: 'मुफ्त में शुरू करें',
      seeDemo: 'डेमो देखें',
      noCcRequired: 'कोई क्रेडिट कार्ड आवश्यक नहीं। गाय, भैंस या मिश्रित दूध के लिए अनुकूलन योग्य।',
      demoTabCollection: 'दूध संकलन',
      demoTabFarmers: 'किसान सूची',
      demoTabRates: 'दर स्लैब',
      demoTabFeed: 'पशु आहार स्टॉक',
      liveMockup: 'लाइव डेमो',
      recordMilkIntakeTitle: 'लाइव दर गणना के साथ दूध प्रविष्टि दर्ज करें',
      recordMilkIntakeDesc: 'दूध की मात्रा और FAT/SNF प्रतिशत दर्ज करें। सिस्टम सक्रिय दर पत्रक से स्वचालित रूप से मूल्य प्राप्त करता है और कुल राशि दिखाता है।',
      shiftSupport: 'सुबह और शाम की पालियों (Shift) का समर्थन करता है।',
      fatValidationWarning: 'गलत FAT% सीमाओं के लिए चेतावनी अलर्ट।',
      printReceipts: 'रसीद पर्ची प्रिंट करें या किसानों को एसएमएस भेजें।',
      collectionCalculator: 'संकलन कैलकुलेटर',
      activeChart: 'सक्रिय चार्ट',
      milkType: 'दूध का प्रकार',
      cow: 'गाय (COW)',
      buffalo: 'भैंस (BUFFALO)',
      mix: 'मिश्रित (फिक्स्ड दर)',
      quantityLitres: 'मात्रा (लीटर)',
      fatPercent: 'फैट (FAT %)',
      snfPercent: 'एसएनएफ (SNF %)',
      computedPrice: 'गणना की गई दर',
      perLitre: '/ लीटर',
      totalPayout: 'कुल भुगतान',
      farmerDirectoryTitle: 'स्वचालित अग्रिम लेजर के साथ किसान निर्देशिका',
      farmerDirectoryDesc: 'प्रत्येक आपूर्तिकर्ता का विवरण रखें। अद्वितीय किसान कोड, बैंक खाते का विवरण जोड़ें और अग्रिम राशि (लोन) प्रबंधित करें जो बिलिंग चक्र के दौरान अपने आप कट जाती है।',
      checkOutstandingAdvance: 'बकाया अग्रिम शेष राशि एक नज़र में देखें।',
      toggleActiveStatus: 'प्रविष्टियाँ रोकने के लिए सक्रिय/निष्क्रिय स्थिति बदलें।',
      integratedLedger: 'दिए गए/काटे गए अग्रिम इतिहास का एकीकृत लेजर।',
      farmersLedgerView: 'किसान लेजर देखें',
      prefers: 'पसंद',
      advanceBalance: 'बकाया अग्रिम',
      rateSlabsTitle: 'FAT और SNF रेंज के आधार पर कॉन्फ़िगर करने योग्य दर पत्रक',
      rateSlabsDesc: 'सटीक मूल्य निर्धारण स्लैब सेट करें। उदाहरण के लिए, 3.5% से 3.9% FAT और 8.5% से 9.0% SNF वाले गाय के दूध की दर ₹36.00/लीटर निर्धारित करें।',
      cowBuffaloMixSheets: 'गाय, भैंस और मिश्रित दूध के लिए अलग-अलग शीट जोड़ें।',
      multipleActiveCharts: 'मौसम के अनुसार वर्गीकृत कई सक्रिय चार्ट।',
      customizableSlabs: 'सरकारी नियमों के अनुसार पूरी तरह से अनुकूलन योग्य।',
      activeCowSlabs: 'सक्रिय गाय स्लैब',
      fatRange: 'फैट रेंज',
      snfRange: 'एसएनएफ रेंज',
      pricePerLitre: 'प्रति लीटर मूल्य',
      feedInventoryTitle: 'पशु आहार इन्वेंट्री और क्रेडिट बिक्री लिंक',
      feedInventoryDesc: 'डेयरी केंद्र आपूर्तिकर्ताओं से थोक में पशु आहार खरीद सकते हैं और पंजीकृत किसानों को बेच सकते हैं, जिसकी राशि किसान के बिलिंग पत्रक में स्वतः जुड़ जाती है।',
      trackBulkInventory: 'थोक इन्वेंट्री और खरीद मूल्य का रिकॉर्ड रखें।',
      recordCustomerFeed: 'उधार/नकद विकल्पों के साथ ग्राहक आहार बिक्री दर्ज करें।',
      linkedWithAccounts: 'अंतिम भुगतान से कटौती के लिए ग्राहक खातों से जुड़ा हुआ।',
      bookFeedSale: 'किसान को पशु आहार बिक्री दर्ज करें',
      stockLeft: 'शेष स्टॉक',
      itemName: 'सामग्री का नाम',
      quantity: 'मात्रा',
      pricePerBag: 'प्रति बोरी मूल्य',
      chargedToLedger: 'लेजर में नाम (उधार)',
      yesAutoDeduct: 'हाँ, बिल में स्वचालित कटौती',
      totalSale: 'कुल बिक्री',
      whyChooseUsTitle: 'विशेष रूप से डेयरी चिलिंग सेंटर और समितियों के लिए निर्मित',
      whyChooseUsDesc: 'पारंपरिक प्रणालियाँ रजिस्टरों और कैलकुलेटर की गलतियों पर निर्भर होती हैं। लेक्टोफ्लो मूल्य निर्धारण नियमों, प्रविष्टियों और भुगतानों को एक क्लिक में केंद्रीकृत करता है।',
      instantFatSnfTitle: 'तत्काल फैट-एसएनएफ खोज',
      instantFatSnfDesc: 'बिना किसी देरी के दूध संग्रह जोड़ें और वास्तविक समय मापदंडों के आधार पर स्वतः गणना की गई दर देखें।',
      advanceDeductionsTitle: 'अग्रिम कटौती',
      advanceDeductionsDesc: 'अग्रिम राशि दें या क्रेडिट पर पशु आहार बैग बेचें। लेक्टोफ्लो अगले बिल चक्र में स्वतः कटौती करता है।',
      paymentSettleWizardTitle: 'भुगतान निपटान विज़ार्ड',
      paymentSettleWizardDesc: 'साप्ताहिक, पाक्षिक या मासिक बिल उत्पन्न करें। कुल दूध मूल्य की गणना करें, आहार और नकद ऋण घटाएं और एक क्लिक में बैंक ट्रांसफर द्वारा भुगतान करें।',
      footerBrand: 'लेक्टोफ्लो डेयरी हब',
      allRightsReserved: 'लेक्टोफ्लो सिस्टम। सर्वाधिकार सुरक्षित।',
      terms: 'नियम',
      privacy: 'गोपनीयता',
      support: 'सहायता',
    },
    auth: {
      signInTitle: 'लेक्टोफ्लो में साइन इन करें',
      registerTitle: 'नया डेयरी खाता बनाएं',
      ownerFullName: 'मालिक का पूरा नाम',
      mobileNumber: 'मोबाइल नंबर',
      password: 'पासवर्ड',
      passwordMin: 'पासवर्ड (न्यूनतम 8 अक्षर)',
      logIn: 'लॉग इन करें',
      signUp: 'साइन अप करें',
      dontHaveAccount: 'खाता नहीं है?',
      alreadyHaveAccount: 'पहले से ही खाता है?',
      stepPhone: 'फोन',
      stepOtp: 'ओटीपी',
      stepDetails: 'विवरण',
      sendOtp: 'ओटीपी भेजें',
      verifyOtp: 'ओटीपी सत्यापित करें',
      otpSentTo: '6 अंकों का कोड भेजा गया था:',
      enterOtp: 'ओटीपी दर्ज करें',
      changeNumber: 'नंबर बदलें',
      resendOtp: 'पुनः ओटीपी भेजें',
      dairyName: 'डेयरी का नाम',
      village: 'गांव',
      taluka: 'तालुका',
      district: 'जिला',
      state: 'राज्य',
      locationInfo: 'स्थान की जानकारी',
      dairyConfig: 'डेयरी प्रणाली विन्यास',
      pricingModel: 'मूल्य निर्धारण मॉडल',
      supportedMilk: 'स्वीकृत दूध प्रकार',
      collectionShift: 'संकलन पाली (Shift)',
      settlementCycle: 'भुगतान चक्र',
      completeRegistration: 'पंजीकरण पूरा करें',
      fatSnfBased: 'FAT और SNF आधारित',
      fatBasedOnly: 'केवल FAT आधारित',
      fixedRate: 'फिक्स्ड दर (समान मूल्य)',
      cowOnly: 'केवल गाय का दूध',
      buffaloOnly: 'केवल भैंस का दूध',
      mixBoth: 'मिश्रित (दोनों स्वीकृत)',
      bothShifts: 'दोनों पालियां (सुबह व शाम)',
      morningOnly: 'केवल सुबह',
      eveningOnly: 'केवल शाम',
      weeklyCycle: 'साप्ताहिक चक्र (7 दिन)',
      biweeklyCycle: 'पाक्षिक चक्र (15 दिन)',
      monthlyCycle: 'मासिक चक्र (30 दिन)',
      dailyCycle: 'दैनिक नकद निपटान',
    },
    dashboard: {
      navOverview: 'डैशबोर्ड अवलोकन',
      navMilkRegistry: 'दूध संकलन रजिस्टर',
      navFarmers: 'किसान खाते',
      navRates: 'दर स्लैब पत्रक',
      navFeeds: 'पशु आहार एवं बिक्री',
      navBilling: 'बिल निपटान',
      navAdvances: 'अग्रिम लेजर',
      landingView: 'मुख्य पृष्ठ',
      logOut: 'लॉग आउट',
      activeDairyHub: 'सक्रिय डेयरी हब',
      loggedInAs: 'के रूप में लॉग इन हैं:',
      pricingMode: 'मूल्य मोड',
      refresh: 'रिफ्रेश',
      litersToday: 'आज कुल लीटर',
      intakeValue: 'आज कुल मूल्य',
      activeFarmers: 'सक्रिय किसान',
      rateChartsCount: 'दर चार्ट्स',
      liveFromDb: 'डेटाबेस से लाइव',
      todaysMilkCollections: 'आज का दूध संकलन',
      noCollectionsToday: 'आज अभी तक कोई दूध एकत्र नहीं किया गया है। रिकॉर्ड दर्ज करने के लिए "दूध संकलन रजिस्टर" टैब पर जाएं।',
      code: 'कोड',
      name: 'नाम',
      shift: 'पाली',
      qtyL: 'मात्रा (L)',
      fatSnf: 'फैट/एसएनएफ',
      rate: 'दर/ली',
      total: 'कुल राशि',
      del: 'हटाएं',
      stockStatus: 'पशु आहार स्टॉक',
      noStockRecorded: 'कोई स्टॉक दर्ज नहीं है। "पशु आहार एवं बिक्री" में खरीद जोड़ें।',
      recordDeliveryEntry: 'दूध प्रविष्टि दर्ज करें',
      morning: 'सुबह',
      evening: 'शाम',
      selectFarmer: '-- किसान चुनें --',
      farmerLabel: 'किसान',
      milkLabel: 'दूध',
      qtyLabel: 'मात्रा (L)',
      fatLabel: 'फैट %',
      snfLabel: 'एसएनएफ %',
      saveMilkCollection: 'दूध संकलन सुरक्षित करें',
      invalidPositiveQty: 'मात्रा 0 से अधिक धनात्मक संख्या होनी चाहिए।',
      invalidPositiveFat: 'फैट % ऋणात्मक नहीं हो सकता।',
      invalidPositiveSnf: 'एसएनएफ % ऋणात्मक नहीं हो सकता।',
      todaysMilkLog: 'आज के दूध संकलन का लॉग',
      noEntriesToday: 'आज कोई प्रविष्टि नहीं',
      searchPlaceholder: 'कोड, नाम या मोबाइल द्वारा खोजें...',
      registerFarmer: 'नया किसान जोड़ें',
      mobile: 'मोबाइल',
      milkType: 'दूध प्रकार',
      address: 'पता',
      status: 'स्थिति',
      active: 'सक्रिय',
      inactive: 'निष्क्रिय',
      noFarmersFound: 'कोई किसान नहीं मिला',
      pricingRateCharts: 'मूल्य निर्धारण दर चार्ट',
      chartsDbDesc: 'दर चार्ट डेटाबेस में संग्रहीत हैं और दूध प्रविष्टि के दौरान लाइव दर गणना के लिए उपयोग किए जाते हैं।',
      noRateCharts: 'अभी तक कोई दर चार्ट कॉन्फ़िगर नहीं किया गया है।',
      baseRate: 'मूल दर',
      fatSteps: 'फैट स्टेप्स',
      cattleFeedStock: 'पशु आहार स्टॉक',
      billingSettlementHub: 'बिलिंग निपटान हब',
      selectFarmerForBilling: 'बिलिंग के लिए किसान चुनें',
      startDate: 'प्रारंभिक तिथि',
      endDate: 'अंतिम तिथि',
      totalLitres: 'कुल लीटर',
      grossAmount: 'कुल सकल राशि',
      netPayable: 'शुद्ध देय राशि',
      settleBill: 'बिल का निपटान और रसीद बनाएं',
      settledBillsHistory: 'निपटाए गए बिलों का इतिहास',
      noBillsSettled: 'इस सत्र के लिए कोई निपटाया गया बिल इतिहास नहीं है।',
      issueAdvance: 'नया अग्रिम (Advance) दें',
      addRepayment: 'पुनर्भुगतान दर्ज करें',
      advanceNumber: 'अग्रिम क्र.',
      originalAmount: 'मूल अग्रिम राशि',
      recoveredAmount: 'वसूल की गई राशि',
      pendingAmount: 'बकाया राशि',
      givenDate: 'दी गई तिथि',
      partiallyRecovered: 'आंशिक वसूल',
      closed: 'पूर्ण (Closed)',
      totalAdvanceIssued: 'कुल दिया गया अग्रिम',
      totalRecoveredAmount: 'कुल वसूली',
      totalPendingBalance: 'कुल बकाया अग्रिम',
      noAdvancesFound: 'कोई अग्रिम रिकॉर्ड नहीं मिला।',
      recordRepaymentTitle: 'मैन्युअल पुनर्भुगतान दर्ज करें',
      repaymentAmountLabel: 'पुनर्भुगतान राशि (₹)',
      notesOptional: 'टिप्पणी / विवरण (वैकल्पिक)',
      saveAdvance: 'अग्रिम जारी करें',
      saveRepayment: 'पुनर्भुगतान सहेजें',
      advanceHistoryTitle: 'लेन-देन इतिहास',
      sellFeedToFarmer: 'किसान को पशु आहार बेचें',
      addDealer: '+ डीलर',
      addPurchase: '+ खरीद',
      chooseFarmer: '-- किसान चुनें --',
      selectFeedBatch: 'पशु आहार बैच (स्टॉक) चुनें',
      chooseBatch: '-- बैच चुनें --',
      quantityBags: 'मात्रा (बोरी)',
      amountPaid: 'भुगतान की गई राशि (₹)',
      bookOnCredit: 'उधार (क्रेडिट) दर्ज करें',
      recordFeedSale: 'पशु आहार बिक्री दर्ज करें',
      feedSalesHistory: 'पशु आहार बिक्री इतिहास',
      date: 'दिनांक',
      feed: 'पशु आहार',
      qty: 'मात्रा',
      mode: 'प्रकार',
      paid: 'नकद',
      credit: 'उधार',
      noSalesRecorded: 'कोई बिक्री दर्ज नहीं की गई',
      addWholesaleDealer: 'थोक डीलर जोड़ें',
      dealerCode: 'डीलर कोड',
      dealerCodePlaceholder: 'उदा. DLR-001',
      dealerName: 'डीलर का नाम',
      dealerNamePlaceholder: 'उदा. विजय पटेल',
      phone: 'फोन नंबर',
      phonePlaceholder: '9876543210',
      addressPlaceholder: 'पता',
      createDealer: 'डीलर बनाएं',
      recordBulkPurchaseTitle: 'थोक स्टॉक खरीद दर्ज करें',
      wholesaleDealer: 'थोक डीलर',
      chooseDealer: '-- डीलर चुनें --',
      feedProductName: 'पशु आहार उत्पाद का नाम',
      feedProductNamePlaceholder: 'उदा. कपिला सुपर फीड 50 किग्रा',
      bagsQty: 'बोरी मात्रा',
      buyRateBag: 'खरीद दर/बोरी (₹)',
      sellRateBag: 'बिक्री दर/बोरी (₹)',
      purchaseDate: 'खरीद की तारीख',
      logBulkPurchase: 'थोक खरीद दर्ज करें',
    },
    customer: {
      title: 'किसान खाते',
      welcome: 'किसान प्रबंधन में आपका स्वागत है',
      loggedInAs: 'के रूप में लॉग इन हैं',
      searchPlaceholder: 'कोड, नाम या मोबाइल द्वारा खोजें...',
      registerButton: 'किसान पंजीकृत करें',
      registerModalTitle: 'किसान पंजीकृत करें',
      customerCode: 'किसान कोड',
      customerCodePlaceholder: 'जैसे 101',
      fullName: 'पूरा नाम',
      fullNamePlaceholder: 'जैसे रमेश पाटिल',
      mobile: 'मोबाइल नंबर',
      mobilePlaceholder: '10 अंकों का नंबर',
      milkType: 'दूध का प्रकार',
      addressVillage: 'पता / गाँव',
      addressPlaceholder: 'गाँव का नाम',
      cow: 'गाय',
      buffalo: 'भैंस',
      mix: 'मिश्रित',
      registerSubmit: 'किसान पंजीकृत करें',
      cancel: 'रद्द करें',
      tableCode: 'कोड',
      tableName: 'नाम',
      tableMobile: 'मोबाइल',
      tableMilkType: 'दूध का प्रकार',
      tableAddress: 'पता',
      tableStatus: 'स्थिति',
      tableActions: 'कार्य',
      statusActive: 'सक्रिय',
      statusInactive: 'निष्क्रिय',
      emptyState: 'कोई किसान नहीं मिला',
      noSearchResults: 'कोई मेल खाने वाला किसान नहीं मिला।',
      loading: 'किसान लोड हो रहे हैं...',
      showing: 'दर्शाया जा रहा है',
      next: 'अगला',
      previous: 'पिछला',
      codeRequired: 'किसान कोड आवश्यक है',
      codeMin: 'किसान कोड कम से कम 1 अक्षर का होना चाहिए',
      codeMax: 'किसान कोड अधिकतम 20 अक्षरों का होना चाहिए',
      nameRequired: 'पूरा नाम आवश्यक है',
      mobileRequired: 'मोबाइल नंबर आवश्यक है',
      mobileInvalid: 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें',
      milkTypeRequired: 'दूध का प्रकार आवश्यक है',
      addressRequired: 'पता आवश्यक है',
      successToast: 'किसान सफलतापूर्वक पंजीकृत हो गया',
      errorToast: 'किसान पंजीकृत करने में असमर्थ',
      duplicateCodeToast: 'किसान कोड पहले से मौजूद है। कृपया दूसरा कोड दर्ज करें।',
    },
  },
  mr: {
    nav: {
      brand: 'लॅक्टोफ्लो',
      features: 'वैशिष्ट्ये',
      rateSheets: 'दर पत्रक',
      pricing: 'दर रचना',
      caseStudies: 'यशोगाथा',
      signIn: 'साइन इन',
      getStarted: 'प्रारंभ करा',
      dashboard: 'डॅशबोर्डवर जा',
      logout: 'लॉगआउट',
      searchFarmers: 'शेतकरी शोधा...',
      language: 'भाषा',
    },
    landing: {
      heroBadge: 'डेअरी व्यवसाय आणि पेमेंटचे ऑटोमेशन',
      heroTitle1: 'डेअरी व्यवसायात आणा कमालीची कार्यक्षमता',
      heroTitleHighlight: 'लॅक्टोफ्लो + स्वयंचलित बिलिंग',
      heroSubtitle: 'दररोज दुधाचे वजन नोंदवा, FAT + SNF दरपत्रकाची आपोआप तपासणी करा, उचल (Advance) व्यवस्थापित करा आणि कालावधीनुसार बिलांचा निपटारा करा.',
      getStartedFree: 'मोफत सुरू करा',
      seeDemo: 'डेमो पहा',
      noCcRequired: 'क्रेडिट कार्डची गरज नाही. गाय, म्हैस किंवा मिक्स दुधासाठी सुलभ.',
      demoTabCollection: 'दूध संकलन',
      demoTabFarmers: 'शेतकरी यादी',
      demoTabRates: 'दर स्लॅब',
      demoTabFeed: 'पशूखाद्य साठा',
      liveMockup: 'लाइव प्रात्यक्षिक',
      recordMilkIntakeTitle: 'थेट दर गणनेसह दूध संकलन नोंदवा',
      recordMilkIntakeDesc: 'दुधाचे वजन आणि FAT/SNF टक्केवारी प्रविष्ट करा. प्रणाली आपोआप सक्रिय दरपत्रकातून दर घेते आणि एकूण रक्कम दर्शवते.',
      shiftSupport: 'सकाळ आणि संध्याकाळच्या दोन्ही शिफ्ट्सना सपोर्ट.',
      fatValidationWarning: 'चुकीच्या FAT% मर्यादांसाठी चेतावणी अलर्ट.',
      printReceipts: 'पावती प्रिंट करा किंवा शेतकऱ्यांना SMS पाठवा.',
      collectionCalculator: 'संकलन कॅल्क्युलेटर',
      activeChart: 'सक्रिय दरपत्रक',
      milkType: 'दुधाचा प्रकार',
      cow: 'गाय (COW)',
      buffalo: 'म्हैस (BUFFALO)',
      mix: 'मिक्स (फिक्स दर)',
      quantityLitres: 'प्रमाण (लिटर)',
      fatPercent: 'फॅट (FAT %)',
      snfPercent: 'एसएनएफ (SNF %)',
      computedPrice: 'गणित केलेला दर',
      perLitre: '/ लिटर',
      totalPayout: 'एकूण रक्कम',
      farmerDirectoryTitle: 'स्वयंचलित ॲडव्हान्स लेजरसह शेतकरी डिरेक्टरी',
      farmerDirectoryDesc: 'प्रत्येक दूध उत्पादकाची माहिती ठेवा. युनिक फार्मर कोड, बँक खात्याचा तपशील जोडा आणि उचल (Advance) व्यवस्थापित करा जे बिलाच्या वेळी आपोआप वजा होते.',
      checkOutstandingAdvance: 'बाकी उचल रक्कम एका दृष्टीक्षेपात पहा.',
      toggleActiveStatus: 'नोंदी थांबवण्यासाठी ॲक्टिव्ह/इनॲक्टिव्ह करा.',
      integratedLedger: 'दिलेल्या व वजा केलेल्या ॲडव्हान्सचा संपूर्ण इतिहास.',
      farmersLedgerView: 'शेतकरी लेजर पहा',
      prefers: 'पसंती',
      advanceBalance: 'बाकी उचल (Advance)',
      rateSlabsTitle: 'FAT आणि SNF रेंजवर आधारित बदलता येणारे दरपत्रक',
      rateSlabsDesc: 'निश्चित दर स्लॅब ठरवा. उदाहरणार्थ, 3.5% ते 3.9% FAT आणि 8.5% ते 9.0% SNF असलेल्या गाईच्या दुधासाठी ₹36.00/लिटर दर निश्चित करा.',
      cowBuffaloMixSheets: 'गाय, म्हैस आणि मिक्स दुधासाठी स्वतंत्र दरपत्रक.',
      multipleActiveCharts: 'हंगामानुसार वर्गीकृत अनेक सक्रिय तक्ते.',
      customizableSlabs: 'सरकारी नियमांनुसार पूर्णपणे सानुकूल करण्यायोग्य.',
      activeCowSlabs: 'सक्रिय गाय स्लॅब',
      fatRange: 'फॅट रेंज',
      snfRange: 'एसएनएफ रेंज',
      pricePerLitre: 'प्रति लिटर दर',
      feedInventoryTitle: 'पशूखाद्य साठा आणि क्रेडिट विक्री',
      feedInventoryDesc: 'डेअरी सेंटर्स पुरवठादारांकडून घाऊक पशूखाद्य खरेदी करू शकतात आणि दूध उत्पादकांना विकू शकतात, ज्याची रक्कम शेतकऱ्याच्या बिलातून वजा होते.',
      trackBulkInventory: 'घाऊक साठा आणि खरेदी दराची नोंद ठेवा.',
      recordCustomerFeed: 'उधारी किंवा रोख पर्यायांसह पशूखाद्य विक्री नोंदवा.',
      linkedWithAccounts: 'अंतिम बिलातून वजावटीसाठी ग्राहक खात्याशी लिंक.',
      bookFeedSale: 'शेतकऱ्याला पशूखाद्य विक्री नोंदवा',
      stockLeft: 'शिल्लक साठा',
      itemName: 'खाद्याचे नाव',
      quantity: 'नग (नग/पोती)',
      pricePerBag: 'प्रति पोते दर',
      chargedToLedger: 'खात्यावर जमा (उधारी)',
      yesAutoDeduct: 'होय, बिलातून आपोआप वजा',
      totalSale: 'एकूण विक्री',
      whyChooseUsTitle: 'खास डेअरी संकलन केंद्र आणि संस्थांसाठी बनवलेले',
      whyChooseUsDesc: 'पारंपारिक पद्धतींमध्ये वह्या आणि कॅल्क्युलेटरच्या चुका होतात. लॅक्टोफ्लो दरपत्रक, नोंदी, उचली आणि पेमेंट एका क्लिकवर सुलभ करते.',
      instantFatSnfTitle: 'झटपट फॅट-एसएनएफ दर शोध',
      instantFatSnfDesc: 'कोणत्याही विलंबाशिवाय संकलन नोंदवा आणि थेट दराची गणना पहा.',
      advanceDeductionsTitle: 'ॲडव्हान्स वजावट',
      advanceDeductionsDesc: 'ॲडव्हान्स द्या किंवा उधारीवर पशूखाद्य द्या. लॅक्टोफ्लो पुढील बिलात आपोआप ही रक्कम वजा करतो.',
      paymentSettleWizardTitle: 'पेमेंट बिलिंग विझार्ड',
      paymentSettleWizardDesc: 'आठवड्याचे, 15 दिवसांचे किंवा महिन्याचे बिल तयार करा. दुधाचे एकूण मूल्य काढा, खाद्य व उचल वजा करा आणि एका क्लिकवर बँक ट्रान्सफर करा.',
      footerBrand: 'लॅक्टोफ्लो डेअरी हब',
      allRightsReserved: 'लॅक्टोफ्लो सिस्टीम. सर्व हक्क सुरक्षित.',
      terms: 'अटी',
      privacy: 'गोपनीयता',
      support: 'संपर्क व मदत',
    },
    auth: {
      signInTitle: 'लॅक्टोफ्लो मध्ये साइन इन करा',
      registerTitle: 'नवीन डेअरी खाते तयार करा',
      ownerFullName: 'मालकाचे पूर्ण नाव',
      mobileNumber: 'मोबाईल नंबर',
      password: 'पासवर्ड',
      passwordMin: 'पासवर्ड (किमान 8 अक्षरे)',
      logIn: 'लॉग इन करा',
      signUp: 'साइन अप करा',
      dontHaveAccount: 'खाते नाही?',
      alreadyHaveAccount: 'आधीच खाते आहे?',
      stepPhone: 'फोन',
      stepOtp: 'ओटीपी',
      stepDetails: 'तपशील',
      sendOtp: 'ओटीपी पाठवा',
      verifyOtp: 'ओटीपी पडताळा',
      otpSentTo: '6 अंकी कोड पाठवला गेला आहे:',
      enterOtp: 'ओटीपी टाका',
      changeNumber: 'नंबर बदला',
      resendOtp: 'पुन्हा ओटीपी पाठवा',
      dairyName: 'डेअरीचे नाव',
      village: 'गाव',
      taluka: 'तालुका',
      district: 'जिल्हा',
      state: 'राज्य',
      locationInfo: 'पत्ता माहिती',
      dairyConfig: 'डेअरी सिस्टीम कॉन्फिगरेशन',
      pricingModel: 'दर पद्धत',
      supportedMilk: 'स्वीकृत दूध प्रकार',
      collectionShift: 'संकलन वेळ (Shift)',
      settlementCycle: 'बिलिंग कालावधी',
      completeRegistration: 'नोंदणी पूर्ण करा',
      fatSnfBased: 'FAT आणि SNF आधारित',
      fatBasedOnly: 'फक्त FAT आधारित',
      fixedRate: 'फिक्स दर (समान किंमत)',
      cowOnly: 'फक्त गाईचे दूध',
      buffaloOnly: 'फक्त म्हशीचे दूध',
      mixBoth: 'मिक्स (दोन्ही स्वीकृत)',
      bothShifts: 'दोन्ही वेळा (सकाळ व संध्याकाळ)',
      morningOnly: 'फक्त सकाळ',
      eveningOnly: 'फक्त संध्याकाळ',
      weeklyCycle: 'साप्ताहिक (7 दिवस)',
      biweeklyCycle: 'पाक्षिक (15 दिवस)',
      monthlyCycle: 'मासिक (30 दिवस)',
      dailyCycle: 'दररोज रोख पेमेंट',
    },
    dashboard: {
      navOverview: 'डॅशबोर्ड सारांश',
      navMilkRegistry: 'दूध संकलन रजिस्टर',
      navFarmers: 'शेतकरी खाती',
      navRates: 'दर पत्रक तक्ता',
      navFeeds: 'पशूखाद्य व विक्री',
      navBilling: 'बिल सेटलमेंट',
      navAdvances: 'ॲडव्हान्स लेजर',
      landingView: 'मुख्य पृष्ठ',
      logOut: 'लॉग आउट',
      activeDairyHub: 'सक्रिय डेअरी हब',
      loggedInAs: 'लॉग इन केलेले खाते:',
      pricingMode: 'दर मोड',
      refresh: 'रिफ्रेश',
      litersToday: 'आज एकूण लिटर',
      intakeValue: 'आजचे एकूण मूल्य',
      activeFarmers: 'सक्रिय दूध उत्पादक',
      rateChartsCount: 'दर पत्रके',
      liveFromDb: 'डेटाबेसवरून थेट',
      todaysMilkCollections: 'आजचे दूध संकलन',
      noCollectionsToday: 'आज अजून दूध संकलन झालेले नाही. "दूध संकलन रजिस्टर" वर जाऊन नोंद करा.',
      code: 'कोड',
      name: 'नाव',
      shift: 'वेळ',
      qtyL: 'प्रमाण (L)',
      fatSnf: 'फॅट/एसएनएफ',
      rate: 'दर/ली',
      total: 'रक्कम',
      del: 'हटवा',
      stockStatus: 'पशूखाद्य साठा',
      noStockRecorded: 'कोणताही साठा नोंदवला नाही. "पशूखाद्य व विक्री" मध्ये खरेदी जोडा.',
      recordDeliveryEntry: 'दूध नोंद प्रविष्ट करा',
      morning: 'सकाळ',
      evening: 'संध्याकाळ',
      selectFarmer: '-- शेतकरी निवडा --',
      farmerLabel: 'शेतकरी',
      milkLabel: 'दूध',
      qtyLabel: 'प्रमाण (L)',
      fatLabel: 'फॅट %',
      snfLabel: 'एसएनएफ %',
      saveMilkCollection: 'दूध नोंद सेव्ह करा',
      invalidPositiveQty: 'प्रमाण (लिटर) ० पेक्षा जास्त धन संख्या असावी.',
      invalidPositiveFat: 'फॅट % ऋण मूल्य असू शकत नाही.',
      invalidPositiveSnf: 'एसएनएफ % ऋण मूल्य असू शकत नाही.',
      todaysMilkLog: 'आजच्या दूध नोंदींचा तक्ता',
      noEntriesToday: 'आज कोणत्याही नोंदी नाहीत',
      searchPlaceholder: 'कोड, नाव किंवा मोबाईलवरून शोधा...',
      registerFarmer: 'नवीन शेतकरी जोडा',
      mobile: 'मोबाईल',
      milkType: 'दूध प्रकार',
      address: 'पत्ता',
      status: 'स्थिती',
      active: 'सक्रिय',
      inactive: 'निष्क्रिय',
      noFarmersFound: 'शेतकरी आढळला नाही',
      pricingRateCharts: 'दर पत्रक तक्ते',
      chartsDbDesc: 'दर पत्रके डेटाबेसमध्ये सेव्ह असतात आणि दूध नोंदीच्या वेळी दर ठरवण्यासाठी वापरली जातात.',
      noRateCharts: 'अद्याप कोणतेही दर पत्रक तयार केलेले नाही.',
      baseRate: 'मूळ दर',
      fatSteps: 'फॅट स्टेप्स',
      cattleFeedStock: 'पशूखाद्य साठा',
      billingSettlementHub: 'बिल सेटलमेंट हब',
      selectFarmerForBilling: 'बिलासाठी शेतकरी निवडा',
      startDate: 'शुरुवातीची तारीख',
      endDate: 'शेवटची तारीख',
      totalLitres: 'एकूण लिटर',
      grossAmount: 'एकूण रक्कम',
      netPayable: 'निव्वळ देय रक्कम',
      settleBill: 'बिल सेटल करा व पावती बनवा',
      settledBillsHistory: 'पूर्वतयार बिलांचा इतिहास',
      noBillsSettled: 'या सत्रासाठी कोणताही बिलाचा इतिहास उपलब्ध नाही.',
      issueAdvance: 'नवीन ॲडव्हान्स (उचल) द्या',
      addRepayment: 'परतफेड नोंदवा',
      advanceNumber: 'ॲडव्हान्स क्र.',
      originalAmount: 'मूळ ॲडव्हान्स रक्कम',
      recoveredAmount: 'वसूल झालेली रक्कम',
      pendingAmount: 'बाकी रक्कम',
      givenDate: 'दिलेली तारीख',
      partiallyRecovered: 'अंशतः वसूल',
      closed: 'पूर्ण (Closed)',
      totalAdvanceIssued: 'एकूण दिलेला ॲडव्हान्स',
      totalRecoveredAmount: 'एकूण वसुली',
      totalPendingBalance: 'एकूण बाकी ॲडव्हान्स',
      noAdvancesFound: 'कोणताही ॲडव्हान्स रेकॉर्ड आढळला नाही.',
      recordRepaymentTitle: 'मॅन्युअल परतफेड नोंदवा',
      repaymentAmountLabel: 'परतफेड रक्कम (₹)',
      notesOptional: 'टीप / तपशील (पर्यायी)',
      saveAdvance: 'ॲडव्हान्स द्या',
      saveRepayment: 'परतफेड सेव्ह करा',
      advanceHistoryTitle: 'व्यवहार इतिहास',
      sellFeedToFarmer: 'शेतकऱ्याला पशूखाद्य विक्री',
      addDealer: '+ डीलर',
      addPurchase: '+ खरेदी',
      chooseFarmer: '-- शेतकरी निवडा --',
      selectFeedBatch: 'पशूखाद्य बॅच (स्टॉक) निवडा',
      chooseBatch: '-- बॅच निवडा --',
      quantityBags: 'प्रमाण (पोती)',
      amountPaid: 'दिलेली रक्कम (₹)',
      bookOnCredit: 'उधारीवर नोंदवा',
      recordFeedSale: 'पशूखाद्य विक्री नोंदवा',
      feedSalesHistory: 'पशूखाद्य विक्री इतिहास',
      date: 'तारीख',
      feed: 'पशूखाद्य',
      qty: 'प्रमाण',
      mode: 'प्रकार',
      paid: 'रोख',
      credit: 'उधारी',
      noSalesRecorded: 'कोणतीही विक्री नोंदवलेली नाही',
      addWholesaleDealer: 'घाऊक विक्रेता जोडा',
      dealerCode: 'डीलर कोड',
      dealerCodePlaceholder: 'उदा. DLR-001',
      dealerName: 'डीलरचे नाव',
      dealerNamePlaceholder: 'उदा. विजय पटेल',
      phone: 'फोन नंबर',
      phonePlaceholder: '9876543210',
      addressPlaceholder: 'पत्ता',
      createDealer: 'डीलर तयार करा',
      recordBulkPurchaseTitle: 'घाऊक पशूखाद्य खरेदी नोंदवा',
      wholesaleDealer: 'घाऊक विक्रेता',
      chooseDealer: '-- डीलर निवडा --',
      feedProductName: 'पशूखाद्य उत्पादनाचे नाव',
      feedProductNamePlaceholder: 'उदा. कपिला सुपर फीड ५० किलो',
      bagsQty: 'पोती प्रमाण',
      buyRateBag: 'खरेदी दर/पोते (₹)',
      sellRateBag: 'विक्री दर/पोते (₹)',
      purchaseDate: 'खरेदीची तारीख',
      logBulkPurchase: 'घाऊक खरेदी नोंदवा',
    },
    customer: {
      title: 'शेतकरी खाती',
      welcome: 'शेतकरी व्यवस्थापनात आपले स्वागत आहे',
      loggedInAs: 'लॉग इन केलेले खाते',
      searchPlaceholder: 'कोड, नाव किंवा मोबाईलवरून शोधा...',
      registerButton: 'शेतकरी नोंदणी करा',
      registerModalTitle: 'शेतकरी नोंदणी करा',
      customerCode: 'शेतकरी कोड',
      customerCodePlaceholder: 'उदा. १०१',
      fullName: 'पूर्ण नाव',
      fullNamePlaceholder: 'उदा. रमेश पाटील',
      mobile: 'मोबाईल नंबर',
      mobilePlaceholder: '१० अंकी नंबर',
      milkType: 'दुधाचा प्रकार',
      addressVillage: 'पत्ता / गाव',
      addressPlaceholder: 'गावाचे नाव',
      cow: 'गाय',
      buffalo: 'म्हैस',
      mix: 'मिक्स',
      registerSubmit: 'शेतकरी नोंदणी करा',
      cancel: 'रद्द करा',
      tableCode: 'कोड',
      tableName: 'नाव',
      tableMobile: 'मोबाईल',
      tableMilkType: 'दूध प्रकार',
      tableAddress: 'पत्ता',
      tableStatus: 'स्थिती',
      tableActions: 'कृती',
      statusActive: 'सक्रिय',
      statusInactive: 'निष्क्रिय',
      emptyState: 'कोणताही शेतकरी आढळला नाही',
      noSearchResults: 'कोणताही जुळणारा शेतकरी आढळला नाही.',
      loading: 'शेतकरी लोड होत आहेत...',
      showing: 'दाखवत आहे',
      next: 'पुढील',
      previous: 'मागील',
      codeRequired: 'शेतकरी कोड आवश्यक आहे',
      codeMin: 'शेतकरी कोड किमान १ अक्षराचा असावा',
      codeMax: 'शेतकरी कोड कमाल २० अक्षरांचा असावा',
      nameRequired: 'पूर्ण नाव आवश्यक आहे',
      mobileRequired: 'मोबाईल नंबर आवश्यक आहे',
      mobileInvalid: 'कृपया १० अंकी वैध मोबाईल नंबर टाका',
      milkTypeRequired: 'दूध प्रकार आवश्यक आहे',
      addressRequired: 'पत्ता आवश्यक आहे',
      successToast: 'शेतकरी नोंदणी यशस्वी झाली',
      errorToast: 'शेतकरी नोंदणी करू शकलो नाही',
      duplicateCodeToast: 'शेतकरी कोड आधीपासूनच अस्तित्वात आहे. कृपया वेगळा कोड टाका.',
    },
  },
};
