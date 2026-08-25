-- Admin Control Center: Employee.employeeCode for Admin ID login

ALTER TABLE "Employee" ADD COLUMN "employeeCode" TEXT;
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");
CREATE INDEX "Employee_employeeCode_idx" ON "Employee"("employeeCode");
