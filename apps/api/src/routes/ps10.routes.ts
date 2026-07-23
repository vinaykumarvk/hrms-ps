import { ApiKernel, accepted, created, ok } from "../http/apiKernel";
import { optionalBoolean, optionalNumber, optionalString, readBodyRecord, requiredString } from "../http/body";
import { ApiQuery, RouteDefinition } from "../http/apiTypes";
import { PayrollAdjustmentCode, PayrollAdjustmentSource } from "../modules/ps10/payrollService";
import { PayCalcMethod, PayComponentCategory, RateTableType, TaxRegime } from "../modules/ps10/payRuleRepository";
import { PerquisiteType } from "../modules/ps10/loanPerquisiteGlService";
import { EngineRunMode } from "../modules/ps10/payrollEngineRepository";
import { PreviousEmployerIncome, Relief891, RemittanceScheme } from "../modules/ps10/taxEngineRepository";
import { FoundationError } from "../platform/types";
import { ph03Ids } from "../seed/ph03Seed";

export const ps10RouteEvidence = {
  salaryStructures: "/api/v1/payroll/salary-structures",
  runs: "/api/v1/payroll/runs",
  lockInputs: "/api/v1/payroll/runs/{id}:lock-inputs",
  compute: "/api/v1/payroll/runs/{id}:compute",
  disburse: "/api/v1/payroll/runs/{id}:disburse",
  // PH-09A rule substrate (BRD PS10 FR-01/FR-02): pay_components / pay_rules / rate_tables.
  payComponents: "/api/v1/payroll/pay-components",
  payRules: "/api/v1/payroll/pay-rules",
  rateTables: "/api/v1/payroll/rate-tables",
  rateResolve: "/api/v1/payroll/rate-tables/resolve",
  // PH-15A tax/TDS engine (BRD PS10 FR-07/FR-17/FR-19): tax_declarations with the full
  // pipeline + regime switch, statutory_remittances lifecycle, Form-16/Form-24Q outputs.
  taxDeclarations: "/api/v1/payroll/tax-declarations",
  taxSwitchRegime: "/api/v1/payroll/tax-declarations:switch-regime",
  remittances: "/api/v1/payroll/statutory/remittances",
  form16: "/api/v1/payroll/statutory/form16:generate",
  form24q: "/api/v1/payroll/statutory/form24q:generate",
  markers: ["PAYROLL_TRACE", "RULE_VERSION_SNAPSHOT", "INPUT_LOCKED", "BANK_X3_EXPORT", "LAST_PAY_DRAWN"],
};

export function registerPS10Routes(kernel: ApiKernel): void {
  const routes: RouteDefinition[] = [
    {
      method: "POST",
      path: "/api/v1/payroll/salary-structures",
      operationId: "ps10.createSalaryStructure",
      protected: true,
      permission: "ps10.salary.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          salaryStructure: context.services.payroll.createSalaryStructure(context.actor, {
            employeeId: optionalString(body, "employeeId") ?? ph03Ids.employee,
            basicPayCents: optionalNumber(body, "basicPayCents") ?? 10000000,
            daRateBps: optionalNumber(body, "daRateBps") ?? 4200,
            hraRateBps: optionalNumber(body, "hraRateBps") ?? 800,
            npsRateBps: optionalNumber(body, "npsRateBps") ?? 1000,
            professionalTaxCents: optionalNumber(body, "professionalTaxCents") ?? 20000,
            ruleVersion: optionalString(body, "ruleVersion") ?? "PAY-RULE-2026-01",
            effectiveFrom: requiredString(body, "effectiveFrom"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/adjustments",
      operationId: "ps10.addAdjustment",
      protected: true,
      permission: "ps10.adjustment.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          adjustment: context.services.payroll.addAdjustment(context.actor, {
            employeeId: optionalString(body, "employeeId") ?? ph03Ids.employee,
            period: requiredString(body, "period"),
            sourceModule: readAdjustmentSource(body),
            code: readAdjustmentCode(body),
            amountCents: optionalNumber(body, "amountCents"),
            lopDays: optionalNumber(body, "lopDays"),
            sourceRef: optionalString(body, "sourceRef") ?? requiredString({ key: context.idempotencyKey }, "key"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/runs",
      operationId: "ps10.createRun",
      protected: true,
      permission: "ps10.payroll.run.create",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({ payrollRun: context.services.payroll.createRun(context.actor, { period: requiredString(body, "period") }) });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/runs/{id}:lock-inputs",
      operationId: "ps10.lockInputs",
      protected: true,
      permission: "ps10.payroll.input.lock",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ payrollRun: context.services.payroll.lockInputs(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/payroll/runs/{id}:compute",
      operationId: "ps10.computeRun",
      protected: true,
      permission: "ps10.payroll.compute",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ payrollRun: context.services.payroll.computeRun(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/payroll/runs/{id}:reconcile",
      operationId: "ps10.reconcileRun",
      protected: true,
      permission: "ps10.payroll.reconcile",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ payrollRun: context.services.payroll.reconcileRun(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/payroll/runs/{id}:approve",
      operationId: "ps10.approveRun",
      protected: true,
      permission: "ps10.payroll.approve",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ payrollRun: context.services.payroll.approveRun(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/payroll/runs/{id}:lock",
      operationId: "ps10.lockRun",
      protected: true,
      permission: "ps10.payroll.lock",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ payrollRun: context.services.payroll.lockRun(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/payroll/runs/{id}:disburse",
      operationId: "ps10.disburseRun",
      protected: true,
      permission: "ps10.payroll.disburse",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ payrollRun: context.services.payroll.disburseRun(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "GET",
      path: "/api/v1/payroll/summary",
      operationId: "ps10.summary",
      protected: true,
      permission: "ps10.payroll.read",
      handler: (context) => ok(context.services.payroll.summary(context.scope)),
    },
    // ---- PH-09A rule substrate: E05 pay_components / E06 pay_rules / E07 rate_tables ----
    {
      method: "POST",
      path: "/api/v1/payroll/pay-components",
      operationId: "ps10.createPayComponent",
      protected: true,
      permission: "ps10.payrule.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          payComponent: context.services.payRules.createPayComponent(context.actor, {
            componentCode: requiredString(body, "componentCode"),
            name: requiredString(body, "name"),
            category: readComponentCategory(body),
            calcMethod: readCalcMethod(body),
            isTaxable: optionalBoolean(body, "isTaxable"),
            isStatutory: optionalBoolean(body, "isStatutory"),
            displayOrder: optionalNumber(body, "displayOrder"),
            effectiveFrom: optionalString(body, "effectiveFrom"),
            effectiveTo: optionalString(body, "effectiveTo"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/pay-rules",
      operationId: "ps10.createPayRule",
      protected: true,
      permission: "ps10.payrule.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          payRule: context.services.payRules.createPayRule(context.actor, {
            componentCode: requiredString(body, "componentCode"),
            calcMethod: readCalcMethod(body),
            formulaExpression: optionalString(body, "formulaExpression"),
            rateTableId: optionalString(body, "rateTableId"),
            computationOrder: optionalNumber(body, "computationOrder"),
            roundingRule: optionalString(body, "roundingRule"),
            effectiveFrom: requiredString(body, "effectiveFrom"),
            effectiveTo: optionalString(body, "effectiveTo"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/rate-tables",
      operationId: "ps10.addRateRow",
      protected: true,
      permission: "ps10.payrule.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          rateRow: context.services.payRules.addRateRow(context.actor, {
            tableType: readRateTableType(requiredString(body, "tableType")),
            state: optionalString(body, "state"),
            cityClass: optionalString(body, "cityClass"),
            regime: readOptionalRegime(optionalString(body, "regime")),
            financialYear: optionalString(body, "financialYear"),
            keyCode: optionalString(body, "keyCode"),
            slabMinCents: optionalNumber(body, "slabMinCents"),
            slabMaxCents: optionalNumber(body, "slabMaxCents"),
            ratePctBps: optionalNumber(body, "ratePctBps"),
            flatAmountCents: optionalNumber(body, "flatAmountCents"),
            effectiveFrom: requiredString(body, "effectiveFrom"),
            effectiveTo: optionalString(body, "effectiveTo"),
          }),
        });
      },
    },
    // ---- PH-15A tax/TDS engine: E15 tax_declarations / E29 statutory_remittances ----
    {
      method: "POST",
      path: "/api/v1/payroll/tax-declarations",
      operationId: "ps10.upsertTaxDeclaration",
      protected: true,
      permission: "ps10.tax.declare",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          taxDeclaration: context.services.taxEngine.upsertDeclaration(context.actor, {
            employeeId: optionalString(body, "employeeId") ?? ph03Ids.employee,
            financialYear: requiredString(body, "financialYear"),
            regime: readRegime(optionalString(body, "regime")),
            declared80cPaise: optionalNumber(body, "declared80cPaise"),
            declared80dPaise: optionalNumber(body, "declared80dPaise"),
            hraExemptionPaise: optionalNumber(body, "hraExemptionPaise"),
            homeLoanInterestPaise: optionalNumber(body, "homeLoanInterestPaise"),
            previousEmployerIncome: readPreviousEmployerIncome(body),
            relief891: readRelief891(body),
            perquisiteTotalPaise: optionalNumber(body, "perquisiteTotalPaise"),
            asOf: optionalString(body, "asOf"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/tax-declarations:switch-regime",
      operationId: "ps10.switchTaxRegime",
      protected: true,
      permission: "ps10.tax.declare",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          taxDeclaration: context.services.taxEngine.switchRegime(context.actor, {
            employeeId: optionalString(body, "employeeId") ?? ph03Ids.employee,
            financialYear: requiredString(body, "financialYear"),
            regime: readRegime(optionalString(body, "regime")),
            asOf: optionalString(body, "asOf"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/tax-declarations:set-cutoff",
      operationId: "ps10.setTaxProofCutoff",
      protected: true,
      permission: "ps10.tax.cutoff",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          taxDeclaration: context.services.taxEngine.setProofCutoff(context.actor, {
            employeeId: optionalString(body, "employeeId") ?? ph03Ids.employee,
            financialYear: requiredString(body, "financialYear"),
            cutoffDate: requiredString(body, "cutoffDate"),
          }),
        });
      },
    },
    {
      method: "GET",
      path: "/api/v1/payroll/tax-declarations",
      operationId: "ps10.getTaxDeclaration",
      protected: true,
      permission: "ps10.tax.read",
      handler: (context) => {
        const query = context.request.query ?? {};
        return ok({
          taxDeclaration: context.services.taxEngine.getDeclaration(
            context.scope,
            query.employeeId ?? ph03Ids.employee,
            requiredQuery(query, "financialYear")
          ),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/statutory/remittances:accrue",
      operationId: "ps10.accrueRemittance",
      protected: true,
      permission: "ps10.statutory.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          remittance: context.services.taxEngine.accrueRemittance(context.actor, {
            scheme: readRemittanceScheme(requiredString(body, "scheme")),
            period: requiredString(body, "period"),
            statutoryDueDate: requiredString(body, "statutoryDueDate"),
            employerTotalPaise: optionalNumber(body, "employerTotalPaise"),
            state: optionalString(body, "state"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/statutory/remittances/{id}:deposit",
      operationId: "ps10.captureRemittanceDeposit",
      protected: true,
      permission: "ps10.statutory.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          remittance: context.services.taxEngine.captureDeposit(context.actor, requiredParam(context.params, "id"), {
            challanNo: requiredString(body, "challanNo"),
            cin: optionalString(body, "cin"),
            depositDate: requiredString(body, "depositDate"),
            depositedAmountPaise: optionalNumber(body, "depositedAmountPaise") ?? 0,
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/statutory/remittances/{id}:match",
      operationId: "ps10.matchRemittance",
      protected: true,
      permission: "ps10.statutory.certify",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          remittance: context.services.taxEngine.matchRemittance(context.actor, requiredParam(context.params, "id"), {
            tolerancePaise: optionalNumber(body, "tolerancePaise"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/statutory/form16:generate",
      operationId: "ps10.generateForm16",
      protected: true,
      permission: "ps10.statutory.certify",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          form16: context.services.taxEngine.generateForm16(context.actor, {
            employeeId: optionalString(body, "employeeId") ?? ph03Ids.employee,
            financialYear: requiredString(body, "financialYear"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/statutory/form24q:generate",
      operationId: "ps10.generateForm24Q",
      protected: true,
      permission: "ps10.statutory.certify",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          form24q: context.services.taxEngine.generateForm24Q(context.actor, {
            financialYear: requiredString(body, "financialYear"),
            quarter: readQuarter(requiredString(body, "quarter")),
          }),
        });
      },
    },
    {
      method: "GET",
      path: "/api/v1/payroll/rate-tables/resolve",
      operationId: "ps10.resolveRate",
      protected: true,
      permission: "ps10.payroll.read",
      handler: (context) => {
        const query = context.request.query ?? {};
        return ok({
          rateRow: context.services.payRules.resolveRate(context.scope, {
            tableType: readRateTableType(requiredQuery(query, "tableType")),
            asOf: requiredQuery(query, "asOf"),
            state: query.state,
            cityClass: query.cityClass,
            regime: readOptionalRegime(query.regime),
            financialYear: query.financialYear,
            keyCode: query.keyCode,
            amountCents: query.amountCents !== undefined ? Number(query.amountCents) : undefined,
          }),
        });
      },
    },
    // PH-29A — PS10 loans/advances instalment recovery + GL->ERP export (route exposure).
    {
      method: "POST",
      path: "/api/v1/payroll/loans:sanction",
      operationId: "ps10.sanctionLoan",
      protected: true,
      permission: "ps10.loan.sanction",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          loan: context.services.loanPerquisiteGl.sanctionLoan(context.actor, {
            employeeId: requiredString(body, "employeeId"),
            loanType: requiredString(body, "loanType"),
            principalPaise: optionalNumber(body, "principalPaise") ?? 0,
            instalmentPaise: optionalNumber(body, "instalmentPaise") ?? 0,
            isConcessional: optionalBoolean(body, "isConcessional"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/gl-export",
      operationId: "ps10.postGlExport",
      protected: true,
      permission: "ps10.glexport.post",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created(
          context.services.glErpPosting.postToErp(context.actor, {
            exportKey: requiredString(body, "exportKey"),
            totalDebitPaise: optionalNumber(body, "totalDebitPaise") ?? 0,
            totalCreditPaise: optionalNumber(body, "totalCreditPaise") ?? 0,
            erpReference: requiredString(body, "erpReference"),
          })
        );
      },
    },
    // PH-46A — FR-PS10-08 loan lifecycle (instalment recovery with net-floor carryforward + foreclosure)
    // + Rule-3 concessional perquisite valuation + reads. Route exposure for tested loanPerquisiteGl backing.
    {
      method: "POST",
      path: "/api/v1/payroll/loans/{id}:instalment",
      operationId: "ps10.recordLoanInstalment",
      protected: true,
      permission: "ps10.loan.recover",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          repayment: context.services.loanPerquisiteGl.recordLoanInstalment(context.actor, requiredParam(context.params, "id"), {
            netAvailablePaise: requiredNumber(body, "netAvailablePaise"),
            recordedAt: requiredString(body, "recordedAt"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/loans/{id}:foreclose",
      operationId: "ps10.forecloseLoan",
      protected: true,
      permission: "ps10.loan.foreclose",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({ repayment: context.services.loanPerquisiteGl.forecloseLoan(context.actor, requiredParam(context.params, "id"), { recordedAt: requiredString(body, "recordedAt") }) });
      },
    },
    {
      method: "GET",
      path: "/api/v1/payroll/loans/{id}/repayments",
      operationId: "ps10.listLoanRepayments",
      protected: true,
      permission: "ps10.loan.read",
      handler: (context) => ok({ items: context.services.loanPerquisiteGl.listLoanRepayments(context.scope, requiredParam(context.params, "id")) }),
    },
    {
      method: "GET",
      path: "/api/v1/payroll/employees/{employeeId}/carryforwards",
      operationId: "ps10.listCarryforwards",
      protected: true,
      permission: "ps10.loan.read",
      handler: (context) => ok({ items: context.services.loanPerquisiteGl.listCarryforwards(context.scope, requiredParam(context.params, "employeeId")) }),
    },
    {
      method: "POST",
      path: "/api/v1/payroll/perquisites:value",
      operationId: "ps10.valuePerquisite",
      protected: true,
      permission: "ps10.perquisite.value",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          perquisite: context.services.loanPerquisiteGl.valuePerquisite(context.actor, {
            employeeId: requiredString(body, "employeeId"),
            perquisiteType: requiredString(body, "perquisiteType") as PerquisiteType,
            isConcessional: optionalBoolean(body, "isConcessional") ?? false,
            baseAmountPaise: requiredNumber(body, "baseAmountPaise"),
            referenceRateBps: optionalNumber(body, "referenceRateBps"),
            employeeRateBps: requiredNumber(body, "employeeRateBps"),
          }),
        });
      },
    },
    // PH-56A — FR-16 payroll engine-run lifecycle (create -> snapshot -> compute -> approve (SoD) -> lock)
    // + reads. Route exposure for already-tested payrollEngine backing.
    {
      method: "POST",
      path: "/api/v1/payroll/engine-runs",
      operationId: "ps10.createEngineRun",
      protected: true,
      permission: "ps10.payroll.compute",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({ run: context.services.payrollEngine.createEngineRun(context.actor, { period: requiredString(body, "period"), runMode: optionalString(body, "runMode") as EngineRunMode | undefined }) });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/engine-runs/{id}:snapshot",
      operationId: "ps10.snapshotEngineRun",
      protected: true,
      permission: "ps10.payroll.input.lock",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ run: context.services.payrollEngine.snapshotRunInputs(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/payroll/engine-runs/{id}:compute",
      operationId: "ps10.computeEngineRun",
      protected: true,
      permission: "ps10.payroll.compute",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted(context.services.payrollEngine.computeEngineRun(context.actor, requiredParam(context.params, "id"))),
    },
    {
      method: "POST",
      path: "/api/v1/payroll/engine-runs/{id}:approve",
      operationId: "ps10.approveEngineRun",
      protected: true,
      permission: "ps10.payroll.approve",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ run: context.services.payrollEngine.approveEngineRun(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/payroll/engine-runs/{id}:lock",
      operationId: "ps10.lockEngineRun",
      protected: true,
      permission: "ps10.payroll.lock",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ run: context.services.payrollEngine.lockEngineRun(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "GET",
      path: "/api/v1/payroll/engine-runs/{id}",
      operationId: "ps10.getEngineRun",
      protected: true,
      permission: "ps10.payroll.read",
      handler: (context) => ok({ run: context.services.payrollEngine.getEngineRun(context.scope, requiredParam(context.params, "id")) }),
    },
    {
      method: "GET",
      path: "/api/v1/payroll/engine-runs/{id}/payslips",
      operationId: "ps10.listRunPayslips",
      protected: true,
      permission: "ps10.payroll.read",
      handler: (context) => ok({ items: context.services.payrollEngine.listRunPayslips(context.scope, requiredParam(context.params, "id")) }),
    },
    // PH-57A — FR-20 full-and-final settlement (settle -> approve with SoD) + recovery/loan/hold reads.
    // Route exposure for already-tested compensationIntegration backing.
    {
      method: "POST",
      path: "/api/v1/payroll/fnf-settlements",
      operationId: "ps10.settleFnf",
      protected: true,
      permission: "ps10.fnf.settle",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          settlement: context.services.compensationIntegration.settleFnf(context.actor, {
            employeeId: requiredString(body, "employeeId"),
            separationDate: requiredString(body, "separationDate"),
            finalMonthPayPaise: requiredNumber(body, "finalMonthPayPaise"),
            leaveEncashmentPaise: optionalNumber(body, "leaveEncashmentPaise"),
            gratuityPaise: optionalNumber(body, "gratuityPaise"),
            noticePayRecoveryPaise: optionalNumber(body, "noticePayRecoveryPaise"),
            finalTdsPaise: optionalNumber(body, "finalTdsPaise"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/payroll/fnf-settlements/{id}:approve",
      operationId: "ps10.approveFnfSettlement",
      protected: true,
      permission: "ps10.fnf.approve",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ settlement: context.services.compensationIntegration.approveFnfSettlement(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "GET",
      path: "/api/v1/payroll/fnf-settlements",
      operationId: "ps10.listFnfSettlements",
      protected: true,
      permission: "ps10.payroll.read",
      handler: (context) => ok({ items: context.services.compensationIntegration.listFnfSettlements(context.scope, context.request.query?.employeeId) }),
    },
    {
      method: "GET",
      path: "/api/v1/payroll/employees/{employeeId}/recovery-schedules",
      operationId: "ps10.listRecoverySchedules",
      protected: true,
      permission: "ps10.payroll.read",
      handler: (context) => ok({ items: context.services.compensationIntegration.listRecoverySchedules(context.scope, requiredParam(context.params, "employeeId")) }),
    },
    {
      method: "GET",
      path: "/api/v1/payroll/employees/{employeeId}/loans",
      operationId: "ps10.listLoans",
      protected: true,
      permission: "ps10.payroll.read",
      handler: (context) => ok({ items: context.services.compensationIntegration.listLoans(context.scope, requiredParam(context.params, "employeeId")) }),
    },
    {
      method: "GET",
      path: "/api/v1/payroll/runs/{runId}/holds",
      operationId: "ps10.listHolds",
      protected: true,
      permission: "ps10.payroll.read",
      handler: (context) => ok({ items: context.services.compensationIntegration.listHolds(context.scope, requiredParam(context.params, "runId")) }),
    },
  ];
  routes.forEach((route) => kernel.register(route));
}

/** A required numeric body field accepting a JSON number or a numeric string. */
function requiredNumber(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(n)) {
    throw new Error(`${key} must be a number`);
  }
  return n;
}

function readAdjustmentSource(body: Record<string, unknown>): PayrollAdjustmentSource {
  const value = optionalString(body, "sourceModule") ?? "PS10";
  if (value === "PS03" || value === "PS05" || value === "PS06" || value === "PS09" || value === "PS10") {
    return value;
  }
  throw new Error(`Unsupported payroll adjustment source ${value}`);
}

function readAdjustmentCode(body: Record<string, unknown>): PayrollAdjustmentCode {
  const value = optionalString(body, "code") ?? "MANUAL_EARNING";
  if (value === "LOP" || value === "TRANSFER_ALLOWANCE" || value === "PROMOTION_ARREARS" || value === "PENALTY_RECOVERY" || value === "MANUAL_EARNING" || value === "MANUAL_DEDUCTION") {
    return value;
  }
  throw new Error(`Unsupported payroll adjustment code ${value}`);
}

function requiredParam(params: Record<string, string>, key: string): string {
  const value = params[key];
  if (!value) {
    throw new Error(`Missing route parameter ${key}`);
  }
  return value;
}

function requiredQuery(query: ApiQuery, key: string): string {
  const value = query[key];
  if (!value) {
    throw new FoundationError("VALIDATION_FAILED", `${key} query parameter is required`, { field: key });
  }
  return value;
}

function readComponentCategory(body: Record<string, unknown>): PayComponentCategory {
  const value = optionalString(body, "category") ?? "EARNING";
  if (value === "EARNING" || value === "DEDUCTION" || value === "PERQUISITE" || value === "EMPLOYER_CONTRIBUTION" || value === "ROUNDING_ADJUSTMENT" || value === "LEAVE_ENCASHMENT") {
    return value;
  }
  throw new FoundationError("VALIDATION_FAILED", `Unsupported pay component category ${value}`, { field: "category" });
}

function readCalcMethod(body: Record<string, unknown>): PayCalcMethod {
  const value = optionalString(body, "calcMethod") ?? "FORMULA";
  if (value === "FLAT" || value === "PERCENTAGE" || value === "SLAB" || value === "MATRIX" || value === "FORMULA") {
    return value;
  }
  throw new FoundationError("VALIDATION_FAILED", `Unsupported calc method ${value}`, { field: "calcMethod" });
}

function readRateTableType(value: string): RateTableType {
  if (value === "DA_RATE" || value === "HRA_CLASS" || value === "PT_SLAB" || value === "TAX_SLAB" || value === "NPS_RATE" || value === "GPF_RATE" || value === "GRATUITY_RATE" || value === "OTHER") {
    return value;
  }
  throw new FoundationError("VALIDATION_FAILED", `Unsupported rate table type ${value}`, { field: "tableType" });
}

function readOptionalRegime(value: string | undefined): TaxRegime | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "OLD" || value === "NEW") {
    return value;
  }
  throw new FoundationError("VALIDATION_FAILED", `Unsupported tax regime ${value}`, { field: "regime" });
}

function readRegime(value: string | undefined): TaxRegime {
  return readOptionalRegime(value) ?? "NEW";
}

function readRemittanceScheme(value: string): RemittanceScheme {
  if (value === "TDS" || value === "PT" || value === "GPF" || value === "CPF" || value === "NPS" || value === "PENSION" || value === "INSURANCE") {
    return value;
  }
  throw new FoundationError("VALIDATION_FAILED", `Unsupported remittance scheme ${value}`, { field: "scheme" });
}

function readQuarter(value: string): "Q1" | "Q2" | "Q3" | "Q4" {
  if (value === "Q1" || value === "Q2" || value === "Q3" || value === "Q4") {
    return value;
  }
  throw new FoundationError("VALIDATION_FAILED", `Unsupported Form-24Q quarter ${value}`, { field: "quarter" });
}

/** Form-12B previous-employer income block (FR-07 AC6). */
function readPreviousEmployerIncome(body: Record<string, unknown>): PreviousEmployerIncome | undefined {
  const block = body.previousEmployerIncome;
  if (block === undefined || block === null) {
    return undefined;
  }
  if (typeof block !== "object" || Array.isArray(block)) {
    throw new FoundationError("VALIDATION_FAILED", "previousEmployerIncome must be an object", { field: "previousEmployerIncome" });
  }
  const record = block as Record<string, unknown>;
  return {
    incomePaise: optionalNumber(record, "incomePaise") ?? 0,
    tdsPaise: optionalNumber(record, "tdsPaise") ?? 0,
    employerTan: optionalString(record, "employerTan"),
  };
}

/** Form-10E / 89(1) relief block (FR-07 AC7). */
function readRelief891(body: Record<string, unknown>): Relief891 | undefined {
  const block = body.relief891;
  if (block === undefined || block === null) {
    return undefined;
  }
  if (typeof block !== "object" || Array.isArray(block)) {
    throw new FoundationError("VALIDATION_FAILED", "relief891 must be an object", { field: "relief891" });
  }
  const record = block as Record<string, unknown>;
  return {
    reliefPaise: optionalNumber(record, "reliefPaise") ?? 0,
    form10eRef: optionalString(record, "form10eRef"),
  };
}
