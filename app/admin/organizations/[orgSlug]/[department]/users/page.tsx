'use client'

import { useParams } from 'next/navigation'
import DepartmentUsersManager from '@/components/admin/department-users-manager'

const ORG_MAP: Record<string, { id: string; name: string }> = {
  'cillah-dev': {
    id: 'a1b2c3d4-e5f6-7890-abcd-222222222222',
    name: 'cillah.dev',
  },
  'rosy-realtors': {
    id: 'a1b2c3d4-e5f6-7890-abcd-555555555555',
    name: 'Rosy Realtors Nairobi',
  },
  'stage-properties': {
    id: 'a1b2c3d4-e5f6-7890-abcd-555555555555',
    name: 'Rosy Realtors Nairobi',
  },
}

export default function OrganizationDepartmentUsersPage() {
  const params = useParams()
  const orgSlug = String(params?.orgSlug || 'cillah-dev').toLowerCase()
  const deptParam = String(params?.department || 'sales').toLowerCase()
  const department: 'sales' | 'marketing' | 'finance' =
    deptParam === 'marketing' || deptParam === 'finance' ? deptParam : 'sales'

  const org = ORG_MAP[orgSlug] || ORG_MAP['cillah-dev']

  const dashboardHref =
    orgSlug === 'cillah-dev'
      ? department === 'sales'
        ? '/admin/dashboard'
        : department === 'marketing'
        ? '/admin/marketing'
        : '/admin/finance'
      : `/admin/organizations/rosy-realtors/${department}`

  return (
    <DepartmentUsersManager
      orgId={org.id}
      orgName={org.name}
      orgSlug={orgSlug}
      department={department}
      dashboardHref={dashboardHref}
    />
  )
}
