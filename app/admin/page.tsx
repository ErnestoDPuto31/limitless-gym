import React from "react";
import { getDashboardStats } from "@/app/actions/adminActions";
import DashboardClient from "./DashboardClient";

export const revalidate = 0;

export default async function DashboardPage() {
  const response = await getDashboardStats();
  
  const stats = response.success && response.stats ? response.stats : {
    todayRevenue: 0,
    revenueChangePercent: 0,
    totalLoginsToday: 0,
    monthlyLogins: 0,
    dailyLogins: 0,
    activeMembersCount: 0,
    newMembersThisWeek: 0
  };

  const activity = response.success && response.activity ? response.activity : [];

  return <DashboardClient stats={stats} activity={activity} />;
}