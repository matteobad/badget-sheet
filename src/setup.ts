const ACCOUNTS_SHEET_NAME = 'Accounts';
const BUDGETS_SHEET_NAME = 'Categories';
const TRANSACTIONS_SHEET_NAME = 'Transactions';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setup = () => {
  const ssTemplate = SpreadsheetApp.openById(
    '1TEcYCaKfinGgDdra7Jk-XchgF9dALsnDYb5oB-wOWOE'
  );

  const ssActive = SpreadsheetApp.getActiveSpreadsheet();

  let accountSheet = ssActive.getSheetByName(ACCOUNTS_SHEET_NAME);
  let budgetsSheet = ssActive.getSheetByName(BUDGETS_SHEET_NAME);
  let transactionsSheet = ssActive.getSheetByName(TRANSACTIONS_SHEET_NAME);

  const now = Date.now().toString();
  const tmp = ssActive.insertSheet(now);

  if (accountSheet) ssActive.deleteSheet(accountSheet);
  if (budgetsSheet) ssActive.deleteSheet(budgetsSheet);
  if (transactionsSheet) ssActive.deleteSheet(transactionsSheet);

  accountSheet = ssTemplate
    .getSheetByName(ACCOUNTS_SHEET_NAME)!
    .copyTo(ssActive)
    .setName(ACCOUNTS_SHEET_NAME);
  budgetsSheet = ssTemplate
    .getSheetByName(BUDGETS_SHEET_NAME)!
    .copyTo(ssActive)
    .setName(BUDGETS_SHEET_NAME);
  transactionsSheet = ssTemplate
    .getSheetByName(TRANSACTIONS_SHEET_NAME)!
    .copyTo(ssActive)
    .setName(TRANSACTIONS_SHEET_NAME);

  ssActive.deleteSheet(tmp);
};

const getAccounts = () => {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const accountsSheet = activeSpreadsheet.getSheetByName(ACCOUNTS_SHEET_NAME)!;

  const newAccounts: Array<unknown[]> = [];
  const accountsRange = accountsSheet.getRange('B3:G');
  const requisitions = getRequisitions();

  requisitions.forEach(requisition => {
    const timeLPassed =
      new Date().getTime() - new Date(requisition.created).getTime();
    const daysPassed = Math.round(timeLPassed / (1000 * 3600 * 24));

    requisition.accounts.forEach(account => {
      const metadata = getAccountMetadata(account);
      const details = getAccountDetails(account);
      const balances = getAccountBalances(account);
      const institution = findInstitutionsById(metadata.institution_id);

      newAccounts.push([
        institution.name,
        details.account.name,
        account,
        Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone(),
          'yyyy-MM-dd'
        ),
        90 - daysPassed + ' days left',
        Number(balances.balances[0].balanceAmount.amount),
      ]);
    });
  });

  _upsertAccount(accountsRange, newAccounts);
};

function createTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  const exists =
    triggers.findIndex(
      trigger => trigger.getUniqueId() === 'TRIGGER_BANK_UPDATE'
    ) !== -1;

  if (!exists) {
    ScriptApp.newTrigger('TRIGGER_BANK_UPDATE')
      .timeBased()
      .everyDays(1)
      .atHour(1)
      .create();
  }
}
