"use client"

import FinanceDepartmentHub from "@/components/finance/finance-department-hub"

export default function FinanceDepartmentPage() {
  return (
    <FinanceDepartmentHub
      orgSlug="cillah-dev"
      orgName="cillah.dev"
      isDemoOrg={false}
      showManageUsersLink={true}
    />
  )
}
