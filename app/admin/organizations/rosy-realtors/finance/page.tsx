"use client"

import FinanceDepartmentHub from "@/components/finance/finance-department-hub"

export default function RosyRealtorsFinancePage() {
  return (
    <FinanceDepartmentHub
      orgSlug="rosy-realtors"
      orgName="Rosy Realtors Nairobi"
      isDemoOrg={true}
      showManageUsersLink={true}
    />
  )
}
