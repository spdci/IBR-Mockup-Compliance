import { defineParameterType } from '@cucumber/cucumber';

// IBR record types returned by searches and notifications (DO.IBR.04 Beneficiary,
// DO.IBR.01 Person, DO.IBR.02 Member, DO.IBR.03 Group).
defineParameterType({
  name: 'recordType',
  regexp: /Beneficiary|IBRPerson|Member|Group/,
  transformer: (s) => s,
});

// Every IBR data object checked by the offline data rules (record types plus the Programme,
// Benefit and BenefitFrequency objects a beneficiary carries).
defineParameterType({
  name: 'dataType',
  regexp: /Beneficiary|IBRPerson|Member|Group|Programme|BenefitFrequency|Benefit/,
  transformer: (s) => s,
});
