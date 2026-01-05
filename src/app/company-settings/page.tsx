'use client'

import React from 'react'
import CompanyContainer from '@/components/company-settings/CompanyContainer'
import { ApplicationShell } from '@/components/ApplicationShell'
import { RouteGuard } from '@/components/RouteGuard'

const CompanySettingsPage: React.FC = () => {
  return (
    <RouteGuard>
      <ApplicationShell>
        <CompanyContainer />
      </ApplicationShell>
    </RouteGuard>
  )
}

export default CompanySettingsPage